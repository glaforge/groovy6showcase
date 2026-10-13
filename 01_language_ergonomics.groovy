/// # Groovy 6.0 — New Language Features & Java Compatibility
///
/// Distills:
/// - `val` contextual keyword for final declarations (GEP-16)
/// - Multi-assignment destructuring: tail/head/middle `*rest`, map `key: var`, `_` discard (GEP-20)
/// - Compound assignment operator overloading (`plusAssign`, `minusAssign`, etc.) (GEP-15)
/// - Nested `copyWith` (dotted paths & transactional block form with `old` and `modify`)
/// - `switch`: position decides statement vs expression, plus `@CompileStatic` jump tables
/// - Java compatibility: `import module` (JEP 511), `instanceof` flow scoping (JEP 394),
///   intersection casts `(Runnable & Serializable)`, and annotation array initializers `{...}`

import module java.sql
import groovy.transform.CompileStatic
import groovy.transform.Immutable
import groovy.transform.OperatorRename
import groovy.transform.RecordType
import groovy.transform.ToString
import java.lang.annotation.Retention
import java.lang.annotation.RetentionPolicy
import java.util.stream.Collectors
import java.util.stream.Stream

println "=== 01. Language Ergonomics & Java Compatibility ==="

// ---------------------------------------------------------------------------
// 1. `val` Contextual Keyword for Final Declarations (GEP-16)
// ---------------------------------------------------------------------------
@CompileStatic
void demoValKeyword() {
    val language = 'Apache Groovy'   // equivalent to `final var` / `final def` (inferred as String)
    val version = 6                  // inferred as int
    val tags = ['jvm', 'dynamic']    // shallow finality: reference is final, list contents can mutate
    tags << 'static'

    assert language == 'Apache Groovy'
    assert version == 6
    assert tags == ['jvm', 'dynamic', 'static']

    // `val` is contextual — still usable as a variable/property/map-key name:
    def val = 42
    def map = [val: val]
    assert map.val == 42
}
demoValKeyword()
println "[OK] 1. `val` contextual keyword"

// ---------------------------------------------------------------------------
// 2. Multi-Assignment Destructuring (GEP-20)
// ---------------------------------------------------------------------------
void demoDestructuring() {
    // 2a. Tail rest binding (*rest)
    def (head, *tail) = [10, 20, 30, 40]
    assert head == 10 && tail == [20, 30, 40]

    // String slice tracks RHS type
    def (char1, char2, *restStr) = 'Groovy6'
    assert char1 == 'G' && char2 == 'r' && restStr == 'oovy6'

    // 2b. Head and middle rest bindings
    def (*init, last) = [1, 2, 3, 4]
    assert init == [1, 2, 3] && last == 4

    def (first, *middle, end) = [1, 2, 3, 4, 5]
    assert first == 1 && middle == [2, 3, 4] && end == 5

    def (a, b, *midRange, y, z) = 1..6
    assert [a, b, y, z] == [1, 2, 5, 6] && midRange == [3, 4]

    // 2c. Lazy Iterator & Stream preservation
    def naturals = (1..Integer.MAX_VALUE).iterator()
    def (n1, *moreNaturals) = naturals
    assert n1 == 1 && moreNaturals.next() == 2 && moreNaturals.next() == 3

    def (header, *bodyStream) = Stream.of('# Title', 'Line 1', 'Line 2')
    assert header == '# Title'
    assert bodyStream.collect(Collectors.toList()) == ['Line 1', 'Line 2']

    // 2d. Map-style key destructuring (with type ascriptions & JavaBeans)
    def user = [name: 'Alice', age: 30, role: 'architect']
    def (name: String fullName, role: r) = user
    assert fullName == 'Alice' && r == 'architect'

    // Discard slots (`_`) and modifier propagation (`final`)
    final ( _, *kept ) = ['skip', 'keep1', 'keep2']
    assert kept == ['keep1', 'keep2']
}
demoDestructuring()
println "[OK] 2. Multi-assignment destructuring (*rest, map keys, lazy streams)"

// ---------------------------------------------------------------------------
// 3. Compound Assignment Operator Overloading (GEP-15)
// ---------------------------------------------------------------------------
@ToString(includeNames = true)
class Counter {
    int value = 0
    int mutations = 0

    // Mutates in place! Used by `+=` without reassigning the reference
    void plusAssign(int delta) {
        value += delta
        mutations++
    }

    void minusAssign(int delta) {
        value -= delta
        mutations++
    }

    // Fallback binary `+` creates a new instance
    Counter plus(int delta) {
        new Counter(value: value + delta, mutations: 0)
    }
}

class CustomBag {
    List<String> items = []
    void appendInPlace(String item) { items << item }
}

@CompileStatic
void demoCompoundAssignment() {
    // Works even on a `final` (`val`) variable because `plusAssign` mutates in place!
    val counter = new Counter(value: 10)
    val originalRef = counter

    counter += 5
    counter -= 3
    assert counter.is(originalRef)
    assert counter.value == 12
    assert counter.mutations == 2

    // Binary `+` still calls `plus()` and returns a new object
    val separate = counter + 8
    assert !separate.is(counter)
    assert separate.value == 20
}

@CompileStatic
@OperatorRename(plusAssign = 'appendInPlace')
void demoOperatorRename() {
    val bag = new CustomBag()
    bag += 'apple'
    bag += 'banana'
    assert bag.items == ['apple', 'banana']
}

demoCompoundAssignment()
demoOperatorRename()
println "[OK] 3. Compound assignment operator overloading (plusAssign, @OperatorRename)"

// ---------------------------------------------------------------------------
// 4. Nested `copyWith` for `@Immutable` and `@RecordType` (GROOVY-12015)
// ---------------------------------------------------------------------------
@Immutable(copyWith = true)
class GeoCoord {
    double lat, lon
}

@Immutable(copyWith = true)
class Address {
    String city
    String zip
    GeoCoord coord
}

@RecordType(copyWith = true)
class Developer {
    String name
    int commits
    Address address
}

void demoNestedCopyWith() {
    val nycCoord = new GeoCoord(40.7128d, -74.0060d)
    val dev = new Developer('Alice', 42, new Address('NYC', '10001', nycCoord))

    // 4a. Dotted-path map keys with structural sharing
    val moved = dev.copyWith('address.city': 'Boston', 'address.zip': '02101')
    assert moved.name == 'Alice'
    assert moved.address.city == 'Boston'
    assert moved.address.zip == '02101'
    // Untouched sub-branch preserves object identity (`is`)!
    assert moved.address.coord.is(nycCoord)

    // 4b. Transactional block form with `old` and `.modify { ... }`
    val promoted = moved.copyWith {
        name = "${old.name} (Lead)".toString()
        commits.modify { it + 10 }
        address.city = old.address.city.toUpperCase()
    }
    assert promoted.name == 'Alice (Lead)'
    assert promoted.commits == 52
    assert promoted.address.city == 'BOSTON'
    assert promoted.address.coord.is(nycCoord)

    // Empty block returns the exact same instance
    assert dev.copyWith {}.is(dev)
}
demoNestedCopyWith()
println "[OK] 4. Nested `copyWith` (dotted paths, transactional block, structural sharing)"

// ---------------------------------------------------------------------------
// 5. Switch: Position Decides Statement vs Expression (GROOVY-12399 / 12405)
// ---------------------------------------------------------------------------
@CompileStatic
String classifyHttpStatus(int code) {
    String category = 'unknown'
    // Arrow switch in statement position does NOT require `default` / exhaustiveness
    switch (code) {
        case 200 -> category = 'OK'
        case 404 -> category = 'Not Found'
    }
    category
}

@CompileStatic
String switchJumpTable(int day) {
    // Statically compiled colon switch statement now emits JVM `tableswitch`!
    String label = 'other'
    switch (day) {
        case 1: label = 'Mon'; break
        case 2: label = 'Tue'; break
        case 3: label = 'Wed'; break
    }
    label
}

assert classifyHttpStatus(200) == 'OK'
assert classifyHttpStatus(500) == 'unknown' // no IllegalStateException in statement position
assert switchJumpTable(2) == 'Tue'
println "[OK] 5. Switch statement vs expression alignment & jump-table dispatch"

// ---------------------------------------------------------------------------
// 6. Java Compatibility: Module Imports, Flow Scoping, Intersection Casts
// ---------------------------------------------------------------------------
@Retention(RetentionPolicy.RUNTIME)
@interface Tags {
    // Java-style array initializer `{...}` in annotation default and usage
    String[] value() default {}
}

@Tags(value = {'groovy6', 'java-compat'})
class AnnotatedSample {}

@CompileStatic
String formatPayload(Object obj) {
    // JEP 394 flow scoping: early-return with negated `!instanceof` binds `s` after the `if`!
    if (obj !instanceof String s) {
        return 'non-string'
    }
    // `s` is known to be a String in scope here!
    return s.trim().toUpperCase()
}

void demoJavaCompatibility() {
    // 6a. `import module java.sql` (at top of script) brings in java.sql.* and transitive exports
    assert Connection.name == 'java.sql.Connection'
    assert DriverManager.name == 'java.sql.DriverManager'

    // 6b. `instanceof` pattern variable flow scoping
    assert formatPayload('  hello groovy 6  ') == 'HELLO GROOVY 6'
    assert formatPayload(123) == 'non-string'

    // 6c. Intersection-type casts for lambdas, method references, and closures
    def serializableLambda = (Runnable & Serializable) () -> { /* no-op */ }
    assert serializableLambda instanceof Runnable
    assert serializableLambda instanceof Serializable

    def serializableClosure = { -> } as (Runnable & Serializable & Cloneable)
    assert serializableClosure instanceof Serializable
    assert serializableClosure instanceof Cloneable
    serializableClosure.run()

    // 6d. Java-style `{...}` array initializers in annotations
    def tags = AnnotatedSample.getAnnotation(Tags).value()
    assert tags == ['groovy6', 'java-compat'] as String[]
}
demoJavaCompatibility()
println "[OK] 6. Java compatibility (module imports, flow scoping, intersection casts, annotation `{}`)"
