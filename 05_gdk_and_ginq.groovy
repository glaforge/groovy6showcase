/// # Groovy 6.0 — New GDK Methods, Fat-Free Lambdas, `groovyToString` & GINQ
///
/// Distills:
/// - `groupByMany` (multi-key grouping on Iterables and value-to-key inversion on Maps)
/// - `zipWithNext` (sliding pairs & deltas) and `groupConsecutive` (maximal runs)
/// - `isSorted`, `clamp`, `takeIf`, `grepping`, `findingResults`, `toMutableList` / `toImmutableList`
/// - Regex group helpers: `findGroups`, `findAllGroups`, and nested `findBalancedGroups`
/// - Locale-aware number formatting & parsing (`toCurrencyString`, `toPercentString`, etc.)
/// - Process `waitForResult()` and async NIO (`Path.textAsync`, `Path.writeAsync`)
/// - Fat-free `java.util.function` overloads & `Closures.curryWith` (zero Closure allocation)
/// - Customisable display protocol with `groovyToString()`
/// - GINQ (graduated from incubating): `groupby ... into g` and `union`/`intersect`/`minus`

@Grab('org.apache.groovy:groovy-ginq:6.0.0')
import groovy.transform.CompileStatic
import java.nio.file.Files
import java.nio.file.Path
import java.util.function.BiPredicate
import java.util.function.Function
import java.util.function.Predicate
import java.util.stream.Stream

import static org.apache.groovy.util.Closures.curryWith

println "=== 05. GDK Extensions, Fat-Free Lambdas, `groovyToString` & GINQ ==="

// ---------------------------------------------------------------------------
// 1. `groupByMany`: Multi-Key Grouping
// ---------------------------------------------------------------------------
var words = ['ant', 'bee', 'ape', 'cow', 'pig']
var vowels = 'aeiou'.toSet()
assert words.groupByMany { String w -> w.toSet().intersect(vowels) } == [
    a: ['ant', 'ape'],
    e: ['bee', 'ape'],
    i: ['pig'],
    o: ['cow']
]

// No-arg Map variant inverts a Map<K, Iterable<V>> into Map<V, List<K>>
var fruitSeasons = [
    apple : ['Autumn', 'Winter'],
    berry : ['Spring', 'Summer'],
    orange: ['Winter']
]
assert fruitSeasons.groupByMany() == [
    Autumn: ['apple'],
    Winter: ['apple', 'orange'],
    Spring: ['berry'],
    Summer: ['berry']
]
println "[OK] 1. groupByMany multi-key grouping"

// ---------------------------------------------------------------------------
// 2. `zipWithNext` & `groupConsecutive`
// ---------------------------------------------------------------------------
assert [1, 2, 3, 4].zipWithNext() == [[1, 2], [2, 3], [3, 4]]
// Successive deltas with the combiner overload:
assert [10, 15, 13, 20].zipWithNext { a, b -> b - a } == [5, -2, 7]

// Maximal consecutive runs (unlike groupBy, only adjacent matching keys merge):
assert [1, 1, 2, 2, 2, 3, 1].groupConsecutive() == [[1, 1], [2, 2, 2], [3], [1]]
assert ['ant', 'ape', 'bee', 'cat', 'cow'].groupConsecutive { it[0] } == [
    ['ant', 'ape'], ['bee'], ['cat', 'cow']
]
println "[OK] 2. zipWithNext & groupConsecutive"

// ---------------------------------------------------------------------------
// 3. `isSorted`, `clamp`, `takeIf`, `grepping`, `toImmutableList` / `toMutableList`
// ---------------------------------------------------------------------------
assert [1, 3, 5, 9].isSorted()
assert ![1, 5, 3].isSorted()

assert 15.clamp(1, 10) == 10
assert (-5).clamp(0..100) == 0

def rawUrl = 'groovy-lang.org'
def normalizedUrl = rawUrl.takeIf { it.startsWith('https://') } ?: "https://$rawUrl".toString()
assert normalizedUrl == 'https://groovy-lang.org'

// Lazy `grepping` on an Iterator (no intermediate collection allocated)
def lazyFiltered = [0, 'hello', '', 42, null, 'world']
    .iterator()
    .grepping(String) // keep Strings
    .grepping()       // keep Groovy-truthy Strings (non-empty)
    .toList()
assert lazyFiltered == ['hello', 'world']

// Explicit mutability accumulators on Stream / Iterable
def immList = Stream.of(1, 2, 3).toImmutableList()
def mutList = Stream.of(1, 2, 3).toMutableList()
mutList << 4
assert immList == [1, 2, 3] && mutList == [1, 2, 3, 4]
println "[OK] 3. isSorted, clamp, takeIf, grepping & stream accumulators"

// ---------------------------------------------------------------------------
// 4. Regex Group Extraction (`findGroups`, `findAllGroups`, `findBalancedGroups`)
// ---------------------------------------------------------------------------
def semver = /(\d+)\.(\d+)\.(\d+)(?:-(.+))?/
def (_, major, minor, patch, qualifier) = '6.0.0-rc-1'.findGroups(semver)
assert [major, minor, patch, qualifier] == ['6', '0', '0', 'rc-1']

// Optional group missing pads with null in multi-assignment:
def (_all, maj2, min2, pat2, qual2) = '6.0.0'.findGroups(semver)
assert [maj2, min2, pat2, qual2] == ['6', '0', '0', null]

// Balanced nested delimiter extraction (returns `BalancedGroup` trees with `.children`!)
def expr = 'calc(add(1, 2), mul(3, 4)) + fn(x)'
def balanced = expr.findBalancedGroups(/\(/, /\)/)
assert balanced*.matchedString == ['(add(1, 2), mul(3, 4))', '(x)']
assert balanced[0].children*.matchedString == ['(1, 2)', '(3, 4)']
println "[OK] 4. findGroups, findAllGroups & findBalancedGroups"

// ---------------------------------------------------------------------------
// 5. Locale-Aware Currency & Percent Formatting / Parsing
// ---------------------------------------------------------------------------
assert 1234.5.toCurrencyString(Locale.US) == '$1,234.50'
assert '$1,234.50'.toCurrencyNumber(Locale.US) == 1234.5G
assert 0.875.toPercentString(Locale.US) == '88%'
assert '94.5%'.toPercentNumber(Locale.US) == 0.945G
println "[OK] 5. Locale-aware currency & percent formatting/parsing"

// ---------------------------------------------------------------------------
// 6. Process `waitForResult()` & Async File I/O (`Path.textAsync` / `writeAsync`)
// ---------------------------------------------------------------------------
def procResult = 'echo Groovy6-Process'.execute().waitForResult()
assert procResult.ok
assert procResult.exitCode == 0
assert procResult.out.trim() == 'Groovy6-Process'

Path tmpFile = Files.createTempFile('groovy6-async-', '.txt')
try {
    await(tmpFile.writeAsync('Async NIO in Groovy 6'))
    String content = await(tmpFile.textAsync)
    assert content == 'Async NIO in Groovy 6'
} finally {
    Files.deleteIfExists(tmpFile)
}
println "[OK] 6. Process waitForResult() & Path async file I/O"

// ---------------------------------------------------------------------------
// 7. Fat-Free Higher-Order Methods (`java.util.function` & `Closures.curryWith`)
// ---------------------------------------------------------------------------
@CompileStatic
void demoFatFreeFunctionalOverloads() {
    Predicate<Integer> isEven = (Integer n) -> n % 2 == 0
    Function<Integer, Integer> triple = (Integer n) -> n * 3
    BiPredicate<Integer, Integer> divisibleBy = (Integer n, Integer d) -> n % d == 0

    assert [1, 2, 3, 4, 5, 6].findAll(isEven) == [2, 4, 6]
    assert [1, 2, 3].collect(triple) == [3, 6, 9]
    assert [1, 2, 3, 4, 5, 6, 9].findAll(curryWith(divisibleBy, 3)) == [3, 6, 9]
}
demoFatFreeFunctionalOverloads()
println "[OK] 7. Fat-free java.util.function overloads & Closures.curryWith"

// ---------------------------------------------------------------------------
// 8. Customisable Object Display with `groovyToString()`
// ---------------------------------------------------------------------------
class SecretToken {
    String raw
    String toString() { raw }
    String groovyToString() { "SecretToken(***${raw.takeRight(3)})" }
}

def tok = new SecretToken(raw: 'ghp_123456789xyz')
assert tok.toString() == 'ghp_123456789xyz'
assert "$tok" == 'SecretToken(***xyz)'
assert [token: tok].toString() == '[token:SecretToken(***xyz)]'
println "[OK] 8. Customisable object display with groovyToString()"

// ---------------------------------------------------------------------------
// 9. GINQ Enhancements (`groupby ... into g` & Set Operators)
// ---------------------------------------------------------------------------
new GroovyShell(new GroovyClassLoader(this.class.classLoader)).evaluate('''
def groupedRows = GQL {
    from n in [1, 11, 111, 8, 80]
    groupby (n % 2 == 0 ? 'even' : 'odd') into g
    orderby g.key in asc
    select g.key as parity, g.count() as cnt, g.sum(x -> x) as total, g.toList() as items
}
assert groupedRows[0].parity == 'even' && groupedRows[0].cnt == 2 && groupedRows[0].total == 88
assert groupedRows[1].parity == 'odd'  && groupedRows[1].cnt == 3 && groupedRows[1].total == 123

def teamA = ['Alice', 'Bob', 'Carol']
def teamB = ['Bob', 'Carol', 'Dave']

assert GQL {
    from u in teamA select u
    union
    from u in teamB select u
} == ['Alice', 'Bob', 'Carol', 'Dave']

assert GQL {
    from u in teamA select u
    intersect
    from u in teamB select u
} == ['Bob', 'Carol']

assert GQL {
    from u in teamA select u
    minus
    from u in teamB select u
} == ['Alice']
''')
println "[OK] 9. GINQ `groupby ... into` and set operators (union, intersect, minus)"
