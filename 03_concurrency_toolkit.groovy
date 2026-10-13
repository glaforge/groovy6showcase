/// # Groovy 6.0 — Integrated Concurrency Toolkit (`groovy.concurrent`)
///
/// Distills:
/// - `Agent` — thread-safe mutable state & reactive `changes()` publisher
/// - `@ActiveObject` & `@ActiveMethod` — actor semantics with plain class syntax
/// - `DataflowVariable` & `Dataflows` — single-assignment variables composing with `await`
/// - Parallel collections (`collectParallel`, `findAllParallel`, `sumParallel`) & `ParallelScope`
/// - `@Parallel` AST transform on loop statements
/// - `BroadcastChannel` (one-to-many)
/// - `ChannelSelect` — full CSP choice (`offers`, mixed send/receive, `when` guards, `fair()`, `after()` timer)

import groovy.concurrent.Agent
import groovy.concurrent.AsyncChannel
import groovy.concurrent.BroadcastChannel
import groovy.concurrent.DataflowVariable
import groovy.concurrent.Dataflows
import groovy.concurrent.ParallelScope
import groovy.concurrent.Pool
import groovy.transform.ActiveMethod
import groovy.transform.ActiveObject
import groovy.transform.Parallel
import java.util.concurrent.ConcurrentLinkedQueue

import static groovy.concurrent.ChannelSelect.*

println "=== 03. Integrated Concurrency Toolkit (`groovy.concurrent`) ==="

// ---------------------------------------------------------------------------
// 1. `Agent`: Thread-Safe State + Reactive `changes()` Stream
// ---------------------------------------------------------------------------
def counterAgent = Agent.create(0)
def observedTransitions = []

async {
    Thread.sleep(15) // ensure `for await` subscriber is attached
    counterAgent.send { it + 10 }
    counterAgent.send { it + 20 }
    counterAgent.send { it + 12 }
    assert await(counterAgent.getAsync()) == 42
    counterAgent.shutdown()
}

for await (val state in counterAgent.changes()) {
    observedTransitions << state
}
assert observedTransitions == [10, 30, 42]
println "[OK] 1. Agent thread-safe state & reactive `changes()` stream"

// ---------------------------------------------------------------------------
// 2. `@ActiveObject` & `@ActiveMethod`: Actor Semantics with Class Syntax
// ---------------------------------------------------------------------------
@ActiveObject
class BankAccount {
    private BigDecimal balance = 0.0G

    @ActiveMethod
    void deposit(BigDecimal amount) {
        balance += amount
    }

    @ActiveMethod
    boolean tryWithdraw(BigDecimal amount) {
        if (amount > balance) return false
        balance -= amount
        return true
    }

    @ActiveMethod
    BigDecimal getBalance() { balance }
}

def account = new BankAccount()
account.deposit(100.0G)
account.deposit(50.0G)
assert account.tryWithdraw(30.0G)
assert !account.tryWithdraw(200.0G)
assert account.balance == 120.0G
println "[OK] 2. @ActiveObject & @ActiveMethod actor transform"

// ---------------------------------------------------------------------------
// 3. `DataflowVariable` & `Dataflows`
// ---------------------------------------------------------------------------
def x = new DataflowVariable<Integer>()
def y = new DataflowVariable<Integer>()
def z = new DataflowVariable<Integer>()

// Consumer starts before x or y are bound — blocks on Virtual Thread until both bind
async { z << await(x) + await(y) }
async { y << 25 }
async { x << 17 }
assert await(z) == 42

// `Dataflows` auto-creates variables on property access
def df = new Dataflows()
async { df.greeting = "Hello, ${df.firstName} ${df.lastName}!".toString() }
async { df.lastName = 'Laforge' }
async { df.firstName = 'Guillaume' }
assert df.greeting == 'Hello, Guillaume Laforge!'
println "[OK] 3. DataflowVariable & Dataflows single-assignment variables"

// ---------------------------------------------------------------------------
// 4. Parallel Collections, `ParallelScope`, and `@Parallel` Loops
// ---------------------------------------------------------------------------
ParallelScope.withPool(Pool.cpu()) {
    val nums = (1..100).toList()
    val evens = nums.findAllParallel { it % 2 == 0 }
    val squaresSum = evens.collectParallel { it * it }.sumParallel { a, b -> a + b }
    assert evens.size() == 50
    assert squaresSum == (1..50).collect { (it * 2) ** 2 }.sum()
}

// `@Parallel` AST transform directly on a `for` loop!
def loopResults = new ConcurrentLinkedQueue<Integer>()
@Parallel
for (Integer i in 1..8) {
    loopResults.add(i * i)
}
assert loopResults.sort() == [1, 4, 9, 16, 25, 36, 49, 64]
println "[OK] 4. Parallel collections, ParallelScope & @Parallel for-loop transform"

// ---------------------------------------------------------------------------
// 5. `BroadcastChannel` & `ChannelSelect` (CSP Guards, Fair Policy, Timers)
// ---------------------------------------------------------------------------
// 5a. BroadcastChannel (one-to-many)
def broadcast = BroadcastChannel.create()
def sub1 = broadcast.asPublisher()
def sub2 = broadcast.asPublisher()

def reader1 = async {
    def list = []
    for await (msg in sub1) { list << msg }
    list
}
def reader2 = async {
    def list = []
    for await (msg in sub2) { list << msg.toUpperCase() }
    list
}

// Let subscribers attach before publishing
Thread.sleep(20)
async {
    ['alpha', 'beta'].each { broadcast.send(it) }
    broadcast.close()
}
assert await(reader1) == ['alpha', 'beta']
assert await(reader2) == ['ALPHA', 'BETA']

// 5b. ChannelSelect with `when` preconditions, `fair()` policy, and `after()` timeout branch
def highPrio = AsyncChannel.create(2)
def lowPrio  = AsyncChannel.create(2)
highPrio.send('H1')
lowPrio.send('L1')

boolean allowHigh = false
// Guarded choice: `highPrio` is guarded off on the first round, so `lowPrio` wins
def selector = offers(
    receive(highPrio).when { allowHigh },
    receive(lowPrio),
    after(50) // timer branch
).fair()

def round1 = await selector.select()
assert round1.index == 1 && round1.value == 'L1'

// Now enable `allowHigh`: `highPrio` is taken on round 2
allowHigh = true
def round2 = await selector.select()
assert round2.index == 0 && round2.value == 'H1'

// Round 3: neither channel has data, so the `after(50)` timer branch wins!
def round3 = await selector.select()
assert round3.timeout
println "[OK] 5. BroadcastChannel & ChannelSelect (guards, fair rotation, timer branch)"
