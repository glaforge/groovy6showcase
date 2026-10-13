/// # Groovy 6.0 — Native Async/Await, Generators & Channels
///
/// Distills:
/// - `async { ... }` and `await(...)` backed by Virtual Threads on JDK 21+ (GROOVY-9381)
/// - Parallel task coordination & multi-assignment `await(a, b, c)`
/// - Lazy generators using `yield return` inside `async` blocks
/// - Go-style `AsyncChannel` with `for await` and composable pipelines (`filter`, `map`)
/// - Structured concurrency with `AsyncScope.run { ... }`

import groovy.concurrent.AsyncChannel
import groovy.concurrent.AsyncScope
import groovy.concurrent.Awaitable

println "=== 02. Native Async/Await, Generators & Channels ==="

// ---------------------------------------------------------------------------
// 1. Sequential-Style Async/Await on Virtual Threads
// ---------------------------------------------------------------------------
Map fetchUserProfile(int id) {
    [id: id, name: 'Guillaume', tier: 'pro', isVirtual: Thread.currentThread().virtual]
}

List<Map> fetchQuests(Map profile) {
    [
        [title: 'Explore Groovy 5', active: false],
        [title: "Master Groovy 6 for ${profile.name}".toString(), active: true]
    ]
}

def activeQuest = await async {
    def profile = await async { fetchUserProfile(42) }
    assert profile.isVirtual // Runs on a JDK 21+ Virtual Thread automatically!
    def quests = await async { fetchQuests(profile) }
    quests.find { it.active }
}

assert activeQuest.title == 'Master Groovy 6 for Guillaume'
println "[OK] 1. Sequential-style async/await on Virtual Threads"

// ---------------------------------------------------------------------------
// 2. Parallel Tasks, Tuple Await & Exception Handling
// ---------------------------------------------------------------------------
def svcA = async { 'Service-A:OK' }
def svcB = async { 'Service-B:OK' }
def svcC = async { 200 }

// Wait for all three and destructure results in one line
def (resA, resB, statusC) = await(svcA, svcB, svcC)
assert resA == 'Service-A:OK' && resB == 'Service-B:OK' && statusC == 200

// Standard try/catch works naturally across `await` boundaries
def recovered = ''
try {
    await async {
        throw new IllegalStateException('Simulated network failure')
    }
} catch (IllegalStateException ex) {
    recovered = ex.message
}
assert recovered == 'Simulated network failure'
println "[OK] 2. Parallel task combinators & standard try/catch error handling"

// ---------------------------------------------------------------------------
// 3. Lazy Generators with `yield return`
// ---------------------------------------------------------------------------
// An `async` closure containing `yield return` becomes a lazy Iterable generator
// with natural back-pressure!
def fibonacci = async {
    long a = 0, b = 1
    while (true) {
        yield return a
        (a, b) = [b, a + b]
    }
}

assert fibonacci.take(10).collect() == [0L, 1L, 1L, 2L, 3L, 5L, 8L, 13L, 21L, 34L]
println "[OK] 3. Lazy infinite generators with `yield return`"

// ---------------------------------------------------------------------------
// 4. Go-Style `AsyncChannel` & Composable Pipelines
// ---------------------------------------------------------------------------
def rawChannel = AsyncChannel.create(10) // buffered channel

// Composable pipeline: filter evens, then square them
def squaredEvens = rawChannel
    .filter { int n -> n % 2 == 0 }
    .map { int n -> n * n }

// Producer task
async {
    for (i in 1..6) {
        rawChannel.send(i)
    }
    rawChannel.close()
}

def received = []
for (val item in squaredEvens) {
    received << item
}
assert received == [4, 16, 36]
println "[OK] 4. Go-style AsyncChannel, pipelines (filter/map) & `for await`"

// ---------------------------------------------------------------------------
// 5. Structured Concurrency with `AsyncScope`
// ---------------------------------------------------------------------------
// `AsyncScope.withScope` binds child task lifetimes to the lexical scope:
// when the block exits, all spawned tasks are guaranteed complete or cancelled.
def summary = AsyncScope.withScope { scope ->
    def usersTask  = scope.async { ['Alice', 'Bob', 'Carol'] }
    def configTask = scope.async { [region: 'eu-west-1', maxRetries: 3] }

    def (users, cfg) = await(usersTask, configTask)
    "${users.size()} users in ${cfg.region}".toString()
}
assert summary == '3 users in eu-west-1'
println "[OK] 5. Structured concurrency via AsyncScope.withScope"
