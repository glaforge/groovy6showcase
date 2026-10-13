/// # Apache Groovy 6.0 — Complete Feature Distillation Runner
///
/// Executes all 7 Groovy 6.0 feature scripts in sequence and reports the summary.

val scripts = [
    '01_language_ergonomics.groovy',
    '02_async_await.groovy',
    '03_concurrency_toolkit.groovy',
    '04_contracts_and_checkers.groovy',
    '05_gdk_and_ginq.groovy',
    '06_batteries_included_modules.groovy',
    '07_tooling_and_compiler.groovy'
]

println "======================================================================"
println "  Apache Groovy ${GroovySystem.version} on JVM ${System.getProperty('java.version')}"
println "  Running ${scripts.size()} Feature Distillation Scripts..."
println "======================================================================\n"

long startAll = System.currentTimeMillis()
val shell = new GroovyShell()

for (scriptName in scripts) {
    long t0 = System.currentTimeMillis()
    shell.run(new File(scriptName), [] as String[])
    long elapsed = System.currentTimeMillis() - t0
    println "--> Completed ${scriptName} in ${elapsed} ms\n"
}

long totalMs = System.currentTimeMillis() - startAll
println "======================================================================"
println "  ALL ${scripts.size()} GROOVY 6.0 SCRIPTS PASSED IN ${totalMs} ms!"
println "======================================================================"
