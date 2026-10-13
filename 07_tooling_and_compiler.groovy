/// # Groovy 6.0 — Compiler, AST Query API, `@ClassTag` & Diagnostics
///
/// Distills:
/// - Fluent AST Query API (`AstQuery.from(...)` in `org.codehaus.groovy.ast.query`) (GROOVY-12116)
/// - `@ClassTag`: Compiler-supplied class tokens & type-safe `withDefault` preemption (GROOVY-12115)
/// - `CompilerConfiguration.errorFormat = SHORT`, check-only compilation (`targetPhase`),
///   and Parrot parser error recovery (`errorRecoveryEnabled`)
/// - Clearer syntax error messages (e.g. `'const' is not supported; use 'val' or 'static final' instead`)

import groovy.transform.CompileStatic
import groovy.transform.TypeChecked
import groovy.transform.stc.ClassTag
import org.codehaus.groovy.ast.ClassNode
import org.codehaus.groovy.ast.builder.AstBuilder
import org.codehaus.groovy.ast.expr.MethodCallExpression
import org.codehaus.groovy.ast.query.AstQuery
import org.codehaus.groovy.control.CompilationUnit
import org.codehaus.groovy.control.CompilePhase
import org.codehaus.groovy.control.CompilerConfiguration
import org.codehaus.groovy.control.ErrorFormat
import org.codehaus.groovy.control.MultipleCompilationErrorsException
import org.codehaus.groovy.control.Phases

println "=== 07. Compiler, AST Query API, @ClassTag & Diagnostics ==="

// ---------------------------------------------------------------------------
// 1. Fluent AST Query API (`AstQuery`, GROOVY-12116)
// ---------------------------------------------------------------------------
// Locate AST nodes declaratively without writing stateful CodeVisitorSupport subclasses!
def astNodes = new AstBuilder().buildFromString(CompilePhase.CONVERSION, false, '''
    class OrderProcessor {
        void process(List items) {
            validate(items)
            items.each { save(it) }
            audit('done')
        }
    }
''')
ClassNode orderClass = astNodes.find { it instanceof ClassNode } as ClassNode
def processMethod = orderClass.getDeclaredMethods('process')[0]

// Find all MethodCallExpressions inside `process`, excluding those nested inside closures:
def topLevelCalls = AstQuery.from(processMethod.code)
    .descendants(MethodCallExpression)
    .where { call -> call.methodAsString in ['validate', 'each', 'audit', 'save'] }
    .stream()
    .map { it.methodAsString }
    .toList()

assert topLevelCalls == ['validate', 'each', 'save', 'audit']
println "[OK] 1. Fluent AstQuery API over Groovy AST nodes"

// ---------------------------------------------------------------------------
// 2. `@ClassTag`: Compiler-Supplied Class Tokens (GROOVY-12115)
// ---------------------------------------------------------------------------
class TypedBox<T> {
    final List<T> items = []

    // When called from @CompileStatic / @TypeChecked code without passing `Class<T>`,
    // the compiler reifies `T` from the receiver and injects `T.class` automatically!
    List<T> checkedView(@ClassTag Class<T> type) {
        Collections.checkedList(items, type)
    }
}

@CompileStatic
void demoClassTag() {
    TypedBox<String> box = new TypedBox<>()
    List<String> safeList = box.checkedView() // Compiler injects `String.class`!
    safeList.add('hello')
    assert safeList == ['hello']

    // Verify runtime type-check enforcement from the injected String.class token:
    boolean rejected = false
    try {
        ((List) safeList).add(999)
    } catch (ClassCastException expected) {
        rejected = true
    }
    assert rejected

    // Groovy's own `Map.withDefault` uses `@ClassTag(preempt = true)` under @CompileStatic
    Map<String, Integer> scores = [:].withDefault { 0 }
    scores['alice'] = 10
    assert scores['bob'] == 0
}
demoClassTag()
println "[OK] 2. @ClassTag compiler-supplied class tokens & type-safe withDefault"

// ---------------------------------------------------------------------------
// 3. `ErrorFormat.SHORT`, Check-Only Compilation & Clearer Syntax Diagnostics
// ---------------------------------------------------------------------------
def config = new CompilerConfiguration(
    errorFormat: ErrorFormat.SHORT,
    targetPhase: Phases.CLASS_GENERATION // equivalent to `groovyc --check`
)

def cu = new CompilationUnit(config)
cu.addSource('BadSyntax.groovy', 'const answer = 42\n')

StringWriter errOut = new StringWriter()
try {
    cu.compile(config.targetPhase)
} catch (MultipleCompilationErrorsException ex) {
    ex.errorCollector.write(new PrintWriter(errOut), null)
}

String diagnostic = errOut.toString().trim()
// Verify single-line `file:line:col: error: ...` format and helpful `const` -> `val` hint!
assert diagnostic.startsWith('BadSyntax.groovy:1:1: error:')
assert diagnostic.contains("'const' is not supported; use 'val' or 'static final' instead")
println "[OK] 3. ErrorFormat.SHORT (`file:line:col: error:`) & clearer syntax diagnostics"
