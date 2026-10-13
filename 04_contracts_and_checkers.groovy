/// # Groovy 6.0 — Contracts, Purity, Type Checkers & Monadic Comprehensions
///
/// Distills:
/// - `groovy-contracts` (graduated from incubating): `@Invariant` (classes, scripts & loops),
///   `@Requires`, `@Ensures` (multiple + `old`), `@Decreases` (loops & recursion), `@ThrowsIf`
/// - `@Modifies` frame conditions & `@Pure` verified at compile time by `ModifiesChecker` & `PurityChecker`
/// - `NullChecker` & `NullChecker(strict: true)` flow-sensitive compile-time null analysis
/// - `CombinerChecker` with `@Associative` & `@Reducer` for parallel reductions
/// - Monadic comprehensions via `DO` macro + `MonadicChecker` (GEP-23)
/// - `@SafeRegex` timeout facility against ReDoS (GROOVY-12122)
/// - `@Virtual` static methods on Traits (GEP-22)

@Grab('org.apache.groovy:groovy-contracts:6.0.0')
@Grab('org.apache.groovy:groovy-typecheckers:6.0.0')
@Grab('org.apache.groovy:groovy-macro-library:6.0.0')
import groovy.contracts.Decreases
import groovy.contracts.Ensures
import groovy.contracts.Invariant
import groovy.contracts.Modifies
import groovy.contracts.Requires
import groovy.contracts.ThrowsIf
import groovy.transform.Associative
import groovy.transform.CompileStatic
import groovy.transform.Pure
import groovy.transform.SafeRegex
import groovy.transform.TypeChecked
import groovy.transform.Virtual
import groovy.util.regex.RegexTimeoutException

println "=== 04. Contracts, Purity, Type Checkers & Monadic Comprehensions ==="

// ---------------------------------------------------------------------------
// 1. Self-Describing Specifications: `@Invariant`, `@Requires`, `@Ensures`,
//    `@Modifies`, `@Pure` + `ModifiesChecker` & `PurityChecker`
// ---------------------------------------------------------------------------
@TypeChecked(extensions = [
    'groovy.typecheckers.ModifiesChecker',
    'groovy.typecheckers.PurityChecker'
])
@Invariant({ balance >= 0G })
class VerifiedWallet {
    BigDecimal balance = 0G
    List<String> auditLog = []

    @Requires({ amount > 0G })
    @Ensures({ balance == old.balance + amount })
    @Ensures({ auditLog.size() > 0 }) // Multiple @Ensures now all fire in Groovy 6!
    @Modifies({ [this.balance, this.auditLog] })
    void credit(BigDecimal amount) {
        balance += amount
        auditLog.add("+$amount".toString())
    }

    @Requires({ amount > 0G && amount <= balance })
    @Ensures({ balance == old.balance - amount })
    @Modifies({ [this.balance, this.auditLog] })
    void debit(BigDecimal amount) {
        balance -= amount
        auditLog.add("-$amount".toString())
    }

    @Pure
    BigDecimal currentBalance() { balance }
}

val wallet = new VerifiedWallet()
wallet.credit(100G)
wallet.debit(35G)
assert wallet.currentBalance() == 65G
assert wallet.auditLog == ['+100', '-35']
println "[OK] 1. @Invariant, @Requires, @Ensures, @Modifies & @Pure with compile-time checkers"

// ---------------------------------------------------------------------------
// 2. Loop `@Invariant` & `@Decreases` + Exceptional `@ThrowsIf`
// ---------------------------------------------------------------------------
@TypeChecked
class VerifiedAlgorithms {
    // Merge two sorted lists with loop invariant + lexicographic termination measure
    @Ensures({ result.isSorted() })
    static List<Integer> mergeSorted(List<Integer> left, List<Integer> right) {
        List<Integer> a = new ArrayList<>(left)
        List<Integer> b = new ArrayList<>(right)
        List<Integer> out = []
        int total = a.size() + b.size()

        @Invariant({ a.size() + b.size() + out.size() == total })
        @Decreases({ [a.size(), b.size()] })
        while (a || b) {
            if (!a) { out.addAll(b); b.clear(); break }
            if (!b) { out.addAll(a); a.clear(); break }
            out << (a[0] <= b[0] ? a.remove(0) : b.remove(0))
        }
        out
    }

    // Recursive termination measure via `@Decreases` on a method
    @Requires({ n >= 0 })
    @Decreases({ n })
    static long factorial(int n) {
        n <= 1 ? 1L : n * factorial(n - 1)
    }

    // `@ThrowsIf` weaves the guard clause automatically at method entry!
    @ThrowsIf(value = { divisor == 0 }, exception = ArithmeticException)
    static int safeDivide(int dividend, int divisor) {
        dividend.intdiv(divisor)
    }
}

assert VerifiedAlgorithms.mergeSorted([1, 4, 7], [2, 3, 8]) == [1, 2, 3, 4, 7, 8]
assert VerifiedAlgorithms.factorial(6) == 720L
assert VerifiedAlgorithms.safeDivide(20, 4) == 5

boolean dividedByZeroCaught = false
try {
    VerifiedAlgorithms.safeDivide(10, 0)
} catch (ArithmeticException expected) {
    dividedByZeroCaught = true
}
assert dividedByZeroCaught
println "[OK] 2. Loop @Invariant/@Decreases, recursive @Decreases & woven @ThrowsIf"

// ---------------------------------------------------------------------------
// 3. `NullChecker` & Parameterized `NullChecker(strict: true)`
// ---------------------------------------------------------------------------
@TypeChecked(extensions = 'groovy.typecheckers.NullChecker(strict: true)')
class NullSafeService {
    static String normalize(String input) {
        def candidate = null
        candidate = input?.trim()
        // Flow-sensitive guard recognised by NullChecker:
        if (candidate != null && !candidate.isEmpty()) {
            return candidate.toUpperCase()
        }
        return 'DEFAULT'
    }
}

assert NullSafeService.normalize('  groovy 6  ') == 'GROOVY 6'
assert NullSafeService.normalize(null) == 'DEFAULT'
println "[OK] 3. Flow-sensitive NullChecker(strict: true)"

// ---------------------------------------------------------------------------
// 4. `CombinerChecker` with `@Associative` for Parallel Reductions
// ---------------------------------------------------------------------------
class MathOps {
    @Associative
    static int sumInts(int a, int b) { a + b }
}

@TypeChecked(extensions = 'groovy.typecheckers.CombinerChecker')
int parallelSumVerified(List<Integer> values) {
    values.injectParallel(0, MathOps.&sumInts)
}

assert parallelSumVerified([10, 20, 30, 40]) == 100
println "[OK] 4. CombinerChecker & @Associative parallel reduction verification"

// ---------------------------------------------------------------------------
// 5. Monadic Comprehensions (`DO` macro + `MonadicChecker`, GEP-23)
// ---------------------------------------------------------------------------
new GroovyShell(new GroovyClassLoader(this.class.classLoader)).evaluate('''
import groovy.transform.TypeChecked
import static org.apache.groovy.macrolib.MacroLibGroovyMethods.DO

@TypeChecked(extensions = 'groovy.typecheckers.MonadicChecker')
Optional<String> formatUserBadge(Map<String, String> directory, String id) {
    DO(
        rawEntry in Optional.ofNullable(directory[id]),
        role     in Optional.ofNullable(rawEntry.contains('|') ? rawEntry.split(/\\|/)[1] : null)
    ) {
        Optional.of("[$id:${role.toUpperCase()}]".toString())
    }
}

val dir = [u1: 'Alice|admin', u2: 'Bob']
assert formatUserBadge(dir, 'u1') == Optional.of('[u1:ADMIN]')
assert formatUserBadge(dir, 'u2') == Optional.empty() // short-circuits cleanly on second step
assert formatUserBadge(dir, 'u9') == Optional.empty() // short-circuits cleanly on first step
''')
println "[OK] 5. Monadic comprehensions (`DO` macro + MonadicChecker)"

// ---------------------------------------------------------------------------
// 6. `@SafeRegex`: Regex Timeout Facility against ReDoS (GROOVY-12122)
// ---------------------------------------------------------------------------
@SafeRegex(millis = 20)
class SafeMatcher {
    static boolean matchesBacktracking(String text) {
        text ==~ /((a+)+)\1!/
    }
}

assert SafeMatcher.matchesBacktracking('aaaa!')
boolean timedOut = false
try {
    SafeMatcher.matchesBacktracking('a' * 60 + 'X')
} catch (RegexTimeoutException ex) {
    timedOut = true
}
assert timedOut
println "[OK] 6. @SafeRegex protection against catastrophic backtracking (ReDoS)"

// ---------------------------------------------------------------------------
// 7. `@Virtual` Static Methods on Traits (GEP-22)
// ---------------------------------------------------------------------------
trait ConfigurableEntity {
    @Virtual static int defaultPageSize() { 25 }
    static String describePagination() { "pageSize=${defaultPageSize()}" }
}

class StandardEntity implements ConfigurableEntity {}
class CompactEntity implements ConfigurableEntity {
    static int defaultPageSize() { 10 } // Overrides the trait's @Virtual static method!
}

assert StandardEntity.describePagination() == 'pageSize=25'
assert CompactEntity.describePagination()  == 'pageSize=10'
println "[OK] 7. @Virtual overridable static methods in traits (GEP-22)"
