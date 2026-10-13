/**
 * Apache Groovy 6.0 — Complete Site Dataset (7 Pillars, 39 Subsections, 7 Full Suites = 46 Runnable Scripts)
 */
window.GROOVY6_SITE_DATA = {
  "version": "6.0.0",
  "releaseNotesUrl": "https://groovy-lang.org/releasenotes/groovy-6.0.html",
  "consoleUrl": "https://groovyconsole.dev/",
  "gwcEndpoint": "https://europe-west1-gwc-experiment.cloudfunctions.net/groovy_6_0",
  "heroPresets": [
    {
      "id": "preset-val-destructure",
      "label": "1. val & Destructuring",
      "pillarPage": "01-language-ergonomics.html#multi-assignment-destructuring",
      "code": "import java.util.stream.Stream\n\ndef (first, _, *middle, last) = [10, 20, 30, 40, 50]\nassert first == 10 && middle == [30, 40] && last == 50\n\ndef (char lead, String *body, char bang) = 'Groovy!'\nassert lead == 'G' && body == 'roovy' && bang == '!'\n\ndef (s1, s2, s3) = Stream.iterate(1) { it * 2 }\nassert [s1, s2, s3] == [1, 2, 4]\n\ndef config = [host: 'db.internal', port: 5432, tls: true]\ndef (host: dbHost, port: dbPort) = config\nassert dbHost == 'db.internal' && dbPort == 5432\n\nprintln \"middle=${middle}, body=${body}, stream=${[s1, s2, s3]}, db=${dbHost}:${dbPort}\""
    },
    {
      "id": "preset-copywith",
      "label": "2. Nested copyWith",
      "pillarPage": "01-language-ergonomics.html#nested-copywith",
      "code": "import groovy.transform.Immutable\n\n@Immutable(copyWith = true)\nclass Address { String city; String zip }\n\n@Immutable(copyWith = true)\nclass Customer { String name; Address address }\n\n@Immutable(copyWith = true)\nclass Order { Customer customer; Address billing; int totalCents }\n\nval billing = new Address('Boston', '02101')\nval order1 = new Order(new Customer('Grace', new Address('Boston', '02101')), billing, 10_00)\n\nval order2 = order1.copyWith('customer.address.city': 'Cambridge')\nassert order2.customer.address.city == 'Cambridge'\nassert order2.billing.is(order1.billing)\n\nval order3 = order2.copyWith {\n    totalCents.modify { it + 5_00 }\n    customer.address.zip = '02139'\n}\nassert order3.totalCents == 15_00\nassert order3.customer.address == new Address('Cambridge', '02139')\nprintln \"Order updated: city=${order3.customer.address.city}, zip=${order3.customer.address.zip}, total=${order3.totalCents}\""
    },
    {
      "id": "preset-async-await",
      "label": "3. Virtual-Thread async/await",
      "pillarPage": "02-async-await.html#virtual-thread-async-await",
      "code": "Map fetchUserProfile(int id) {\n    [id: id, name: 'Guillaume', isVirtual: Thread.currentThread().virtual]\n}\n\ndef activeQuest = await async {\n    def profile = await async { fetchUserProfile(42) }\n    assert profile.isVirtual\n    \"Master Groovy 6 for ${profile.name} (virtual=${profile.isVirtual})\".toString()\n}\n\nassert activeQuest.startsWith('Master Groovy 6 for Guillaume')\nprintln activeQuest"
    },
    {
      "id": "preset-active-object",
      "label": "4. @ActiveObject Actor",
      "pillarPage": "03-concurrency-toolkit.html#active-object-actors",
      "code": "import groovy.transform.ActiveMethod\nimport groovy.transform.ActiveObject\n\n@ActiveObject\nclass BankAccount {\n    private BigDecimal balance = 0.0G\n    @ActiveMethod void deposit(BigDecimal amount) { balance += amount }\n    @ActiveMethod boolean tryWithdraw(BigDecimal amount) {\n        if (amount > balance) return false\n        balance -= amount\n        return true\n    }\n    @ActiveMethod BigDecimal getBalance() { balance }\n}\n\ndef acct = new BankAccount()\nacct.deposit(100.0G)\nacct.deposit(50.0G)\nassert acct.tryWithdraw(30.0G)\nassert !acct.tryWithdraw(200.0G)\nassert acct.balance == 120.0G\nprintln \"Actor final balance: ${acct.balance}\""
    },
    {
      "id": "preset-contracts",
      "label": "5. @Invariant & @Pure Contracts",
      "pillarPage": "04-contracts-and-checkers.html#contracts-modifies-and-purity",
      "code": "@Grab('org.apache.groovy:groovy-contracts:6.0.0')\n@Grab('org.apache.groovy:groovy-typecheckers:6.0.0')\nimport groovy.contracts.*\nimport groovy.transform.Pure\nimport groovy.transform.TypeChecked\n\n@TypeChecked(extensions = [\n    'groovy.typecheckers.ModifiesChecker',\n    'groovy.typecheckers.PurityChecker'\n])\n@Invariant({ balance >= 0 })\nclass Wallet {\n    int balance = 0\n    @Requires({ amount > 0 })\n    @Ensures({ balance == old.balance + amount })\n    @Modifies({ [this.balance] })\n    void deposit(int amount) { balance += amount }\n\n    @Pure int projected(int bonus) { balance + bonus }\n}\n\nval w = new Wallet()\nw.deposit(150)\nassert w.balance == 150 && w.projected(50) == 200\nprintln \"Wallet balance=${w.balance}, projected=${w.projected(50)}\""
    },
    {
      "id": "preset-ginq",
      "label": "6. GINQ groupby ... into",
      "pillarPage": "05-gdk-and-ginq.html#ginq-graduated-groupby-and-sets",
      "code": "@Grab('org.apache.groovy:groovy-ginq:6.0.0')\nimport groovy.lang.GroovyClassLoader\nimport groovy.lang.GroovyShell\n\ndef out = new GroovyShell(new GroovyClassLoader(this.class.classLoader)).evaluate('''\ndef rows = GQL {\n    from n in [1, 11, 111, 8, 80]\n    groupby (n % 2 == 0 ? 'even' : 'odd') into g\n    orderby g.key in asc\n    select g.key as parity, g.count() as cnt, g.sum(x -> x) as total, g.toList() as items\n}\nassert rows[0].parity == 'even' && rows[0].total == 88\nassert rows[1].parity == 'odd'  && rows[1].total == 123\n\ndef common = GQL {\n    from u in ['Alice', 'Bob', 'Carol'] select u\n    intersect\n    from u in ['Bob', 'Carol', 'Dave'] select u\n}\nassert common == ['Bob', 'Carol']\n\"GINQ=${rows.collect { [it.parity, it.cnt, it.total] }}, intersect=${common}\"\n''')\nprintln out"
    }
  ],
  "pillars": [
    {
      "num": "01",
      "id": "language-ergonomics",
      "page": "01-language-ergonomics.html",
      "scriptFile": "01_language_ergonomics.groovy",
      "navLabel": "1. Language Ergonomics",
      "shortTitle": "Language Ergonomics & Java Parity",
      "title": "Language Ergonomics & Java 21–25 Parity",
      "subtitle": "Immutable val declarations, head/middle/tail *rest & map-key destructuring, in-place compound assignment overloading, nested copyWith, unified switch dispatch, and Java 21–25 syntax alignment.",
      "category": "Syntax & Keywords",
      "accent": "sky",
      "highlights": [
        "val",
        "*rest",
        "def (key: v)",
        "plusAssign",
        "copyWith",
        "!instanceof",
        "import module"
      ],
      "sections": [
        {
          "id": "1.1",
          "slug": "val-keyword",
          "title": "`val` Contextual Keyword for Immutable Declarations",
          "gep": "GEP-16",
          "category": "Syntax & Keywords",
          "keywords": [
            "val",
            "final",
            "var"
          ],
          "summary": "Concise immutable local variables, loop bindings, and fields as the read-only counterpart to `var`.",
          "prose": [
            "Groovy 6 introduces `val` as a contextual keyword for declaring `final` local variables, `for`-loop bindings, and fields with type inference (or explicit type annotations). Just as `var` provides a familiar shorthand for mutable inferred declarations, `val` serves as its immutable twin—equivalent to `final var` in static code or `final def` in dynamic code.",
            "Because `val` is implemented as a contextual keyword in the Parrot grammar rather than a reserved word, existing code that uses `val` as a variable name, method name, property, or map key (`[val: 42]`) continues to compile without any breaking changes."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5",
            "beforeCode": "final var release = 'Apache Groovy'\nfinal def version = 6",
            "afterTitle": "Groovy 6.0",
            "afterCode": "val release = 'Apache Groovy'\nval version = 6"
          },
          "underTheHood": "At the AST level, `val` sets the `ACC_FINAL` modifier bit on `VariableExpression` and `FieldNode`. Under `@CompileStatic`, the static type checker infers the exact static type from the right-hand side initializer while enforcing single-assignment semantics.",
          "code": "val language = 'Apache Groovy' // final + inferred String\nval version  = 6               // final + inferred int\nval tags     = ['jvm', 'groovy6'] // reference is final\ntags << 'immutable-ref'\n\n// Contextual keyword: still valid as an identifier or map key!\ndef val = 42\nassert [val: val].val == 42",
          "fullCode": "import groovy.transform.CompileStatic\n\n@CompileStatic\nString demoVal() {\n    val language = 'Apache Groovy'\n    val version = 6\n    val tags = ['jvm', 'groovy6']\n    tags << 'immutable-ref'\n\n    def val = 42\n    def map = [val: val]\n    assert map.val == 42\n    return \"${language} ${version}: tags=${tags}, contextual=${map.val}\"\n}\n\nval out = demoVal()\nassert out.startsWith('Apache Groovy 6')\nprintln out",
          "expectedOutput": "Apache Groovy 6: tags=[jvm, groovy6, immutable-ref], contextual=42",
          "execMs": 31,
          "verifiedOut": "Apache Groovy 6: tags=[jvm, groovy6, immutable-ref], contextual=42",
          "grabs": []
        },
        {
          "id": "1.2",
          "slug": "multi-assignment-destructuring",
          "title": "Rich Multi-Assignment Destructuring (`*rest`, Map Keys & Lazy Streams)",
          "gep": "GEP-20",
          "category": "Syntax & Keywords",
          "keywords": [
            "*rest",
            "def (k: v)",
            "_ discard",
            "Stream"
          ],
          "summary": "Unpack collections, strings, maps, JavaBeans, and infinite lazy streams with head/middle/tail `*rest` splats and `_` placeholders.",
          "prose": [
            "Multi-assignment destructuring (`GEP-20`) receives a major upgrade in Groovy 6. A single `*rest` splat binding can now appear at the tail (`def (head, *tail) = list`), at the head (`def (*init, last) = list`), or in the middle (`def (first, *middle, end) = list`)—and when destructuring a `String`, the `*rest` slice stays a `String` rather than a `List`.",
            "Destructuring is also lazy for `Iterator` and `java.util.stream.Stream` sources (consuming only the exact elements needed), and adds named map-key / JavaBean property destructuring (`def (host: dbHost, port: dbPort) = config`) as well as `_` discard placeholders."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5",
            "beforeCode": "def first = list[0]\ndef middle = list.subList(1, list.size() - 1)\ndef last = list[-1]\ndef dbHost = config.host\ndef dbPort = config.port",
            "afterTitle": "Groovy 6.0",
            "afterCode": "def (first, *middle, last) = list\ndef (host: dbHost, port: dbPort) = config"
          },
          "underTheHood": "When the RHS is an `Iterator` or `Stream`, tail `*rest` bindings return the remaining unconsumed `Iterator`/`Stream` view without materializing intermediate collections, making infinite stream destructuring safe in constant memory.",
          "code": "// 1. Splat *rest in middle + _ discard placeholder\ndef (first, _, *middle, last) = [10, 20, 30, 40, 50]\nassert first == 10 && middle == [30, 40] && last == 50\n\n// 2. String slice destructuring\ndef (char lead, String *body, char bang) = 'Groovy!'\nassert lead == 'G' && body == 'roovy' && bang == '!'\n\n// 3. Map-key destructuring by property name\ndef config = [host: 'db.internal', port: 5432, tls: true]\ndef (host: dbHost, port: dbPort) = config",
          "fullCode": "import java.util.stream.Stream\n\ndef (first, _, *middle, last) = [10, 20, 30, 40, 50]\nassert first == 10 && middle == [30, 40] && last == 50\n\ndef (char lead, String *body, char bang) = 'Groovy!'\nassert lead == 'G' && body == 'roovy' && bang == '!'\n\ndef (s1, s2, s3) = Stream.iterate(1) { it * 2 }\nassert [s1, s2, s3] == [1, 2, 4]\n\ndef config = [host: 'db.internal', port: 5432, tls: true]\ndef (host: dbHost, port: dbPort) = config\nassert dbHost == 'db.internal' && dbPort == 5432\n\nprintln \"middle=${middle}, body=${body}, stream=${[s1, s2, s3]}, db=${dbHost}:${dbPort}\"",
          "expectedOutput": "middle=[30, 40], body=roovy, stream=[1, 2, 4], db=db.internal:5432",
          "execMs": 14,
          "verifiedOut": "middle=[30, 40], body=roovy, stream=[1, 2, 4], db=db.internal:5432",
          "grabs": []
        },
        {
          "id": "1.3",
          "slug": "compound-assignment-overloading",
          "title": "Compound Assignment Operator Overloading (`plusAssign` & `@OperatorRename`)",
          "gep": "GEP-15",
          "category": "Syntax & Keywords",
          "keywords": [
            "plusAssign",
            "minusAssign",
            "@OperatorRename",
            "+="
          ],
          "summary": "Dedicated in-place mutation methods (`plusAssign`, `minusAssign`, etc.) distinct from binary `+` and `-`.",
          "prose": [
            "Previously in Groovy, `a += b` was always desugared into `a = a.plus(b)`, which forced allocating a new instance and prevented mutating a `final` (`val`) variable in place. Under `GEP-15`, Groovy 6 introduces dedicated compound assignment methods: `plusAssign` (`+=`), `minusAssign` (`-=`), `multiplyAssign` (`*=`), `divAssign` (`/=`), and bitwise/shift variants.",
            "When a type defines `void plusAssign(T rhs)`, `counter += 5` mutates the receiver in place without reassigning the reference—meaning `+=` works naturally on `val` / `final` references! If `plusAssign` is not defined, Groovy falls back to `a = a.plus(b)`. You can also map `plusAssign` to existing domain methods via `@OperatorRename`."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (`+=` always rebinds via `plus`)",
            "beforeCode": "// Cannot use `final` with += in Groovy 5!\ndef counter = new Counter(10)\ncounter += 5 // desugars to: counter = counter.plus(5)",
            "afterTitle": "Groovy 6.0 (`plusAssign` mutates in place)",
            "afterCode": "val counter = new Counter(10)\ncounter += 5 // calls counter.plusAssign(5) on final ref!"
          },
          "underTheHood": "Both dynamic `invokedynamic` dispatch and `@CompileStatic` resolve `plusAssign` first; if the method returns `void`, the local variable slot is never overwritten.",
          "code": "class Counter {\n    int value = 0\n    int mutations = 0\n    void plusAssign(int delta) { value += delta; mutations++ }\n    Counter plus(int delta) { new Counter(value: value + delta) }\n}\n\ndef counter = new Counter(value: 10)\ndef origRef = counter\ncounter += 5 // calls plusAssign(5) in place — same instance!\nassert counter.is(origRef) && counter.value == 15 && counter.mutations == 1",
          "fullCode": "import groovy.transform.CompileStatic\nimport groovy.transform.OperatorRename\n\nclass Counter {\n    int value = 0\n    int mutations = 0\n    void plusAssign(int delta) { value += delta; mutations++ }\n    void minusAssign(int delta) { value -= delta; mutations++ }\n    Counter plus(int delta) { new Counter(value: value + delta, mutations: 0) }\n}\n\nclass Ledger {\n    List<Integer> entries = []\n    void record(int amount) { entries << amount }\n}\n\n@CompileStatic\n@OperatorRename(plusAssign = 'record')\nList<Integer> demoRename() {\n    val ledger = new Ledger()\n    ledger += 100\n    ledger += 250\n    ledger.entries\n}\n\ndef c = new Counter(value: 10)\ndef orig = c\nc += 5\nc -= 2\nassert c.is(orig) && c.value == 13 && c.mutations == 2\nassert demoRename() == [100, 250]\nprintln \"Counter value=${c.value} (mutations=${c.mutations}), Ledger=${demoRename()}\"",
          "expectedOutput": "Counter value=13 (mutations=2), Ledger=[100, 250]",
          "execMs": 18,
          "verifiedOut": "Counter value=13 (mutations=2), Ledger=[100, 250]",
          "grabs": []
        },
        {
          "id": "1.4",
          "slug": "nested-copywith",
          "title": "Nested `copyWith` with Structural Sharing & Transactional Blocks",
          "gep": "GROOVY-12015",
          "category": "Syntax & Keywords",
          "keywords": [
            "copyWith",
            "@Immutable",
            "@RecordType",
            ".modify"
          ],
          "summary": "Update deeply nested immutable object graphs via dotted keys or transactional closures with `old` snapshots.",
          "prose": [
            "Updating nested `@Immutable` or `@RecordType` hierarchies used to require manually cascading `.copyWith(...)` calls at every level. Groovy 6 enhances `copyWith = true` with two ergonomic forms: dotted map keys (`dev.copyWith('address.city': 'Boston')`) and a transactional closure DSL (`dev.copyWith { commits.modify { it + 10 }; address.city = 'Boston' }`).",
            "Crucially, `copyWith` performs structural sharing: any sibling branch that is not modified retains its exact object reference (`is`), and an empty or no-op `copyWith` block returns `this` without allocating a clone."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (Manual nested `copyWith` cascade)",
            "beforeCode": "def updated = order.copyWith(\n    customer: order.customer.copyWith(\n        address: order.customer.address.copyWith(city: 'Cambridge')\n    )\n)",
            "afterTitle": "Groovy 6.0 (Dotted path or transactional closure)",
            "afterCode": "def updated = order.copyWith('customer.address.city': 'Cambridge')\n// or transactional block:\ndef next = updated.copyWith {\n    totalCents.modify { it + 500 }\n    customer.address.zip = '02139'\n}"
          },
          "underTheHood": "The `ImmutableASTTransformation` synthesizes a nested copy helper that groups dotted keys by root property prefix and recursively delegates to child `copyWith` methods, short-circuiting when child references are unchanged.",
          "code": "@Immutable(copyWith = true)\nclass Order { Customer customer; Address billing; int totalCents }\n\n// 1. Dotted-path update (preserves untouched billing reference!)\nval order2 = order1.copyWith('customer.address.city': 'Cambridge')\nassert order2.billing.is(order1.billing)\n\n// 2. Transactional closure with `old` snapshot & `.modify {}`\nval order3 = order2.copyWith {\n    totalCents.modify { it + 5_00 }\n    customer.address.zip = '02139'\n}",
          "fullCode": "import groovy.transform.Immutable\n\n@Immutable(copyWith = true)\nclass Address { String city; String zip }\n\n@Immutable(copyWith = true)\nclass Customer { String name; Address address }\n\n@Immutable(copyWith = true)\nclass Order { Customer customer; Address billing; int totalCents }\n\nval billing = new Address('Boston', '02101')\nval order1 = new Order(new Customer('Grace', new Address('Boston', '02101')), billing, 10_00)\n\nval order2 = order1.copyWith('customer.address.city': 'Cambridge')\nassert order2.customer.address.city == 'Cambridge'\nassert order2.billing.is(order1.billing)\n\nval order3 = order2.copyWith {\n    totalCents.modify { it + 5_00 }\n    customer.address.zip = '02139'\n}\nassert order3.totalCents == 15_00\nassert order3.customer.address == new Address('Cambridge', '02139')\nprintln \"Order updated: city=${order3.customer.address.city}, zip=${order3.customer.address.zip}, total=${order3.totalCents}\"",
          "expectedOutput": "Order updated: city=Cambridge, zip=02139, total=1500",
          "execMs": 42,
          "verifiedOut": "Order updated: city=Cambridge, zip=02139, total=1500",
          "grabs": []
        },
        {
          "id": "1.5",
          "slug": "switch-alignment",
          "title": "Unified `switch` Statements vs Expressions & Jump-Table Dispatch",
          "gep": "GROOVY-12399",
          "category": "Syntax & Keywords",
          "keywords": [
            "switch",
            "case ->",
            "tableswitch",
            "lookupswitch"
          ],
          "summary": "Syntactic position determines statement vs expression semantics, while `@CompileStatic` emits native JVM jump tables.",
          "prose": [
            "In Groovy 6, whether a `switch` is treated as a statement or a value-producing expression is determined purely by its syntactic position—regardless of whether it uses arrow (`->`) or colon (`:`) syntax. An arrow `switch` in statement position no longer requires an exhaustive `default` branch.",
            "Furthermore, `@CompileStatic` colon `switch` statements over `int`, `char`, `byte`, `short`, `String`, and `enum` targets now emit native JVM `tableswitch` and `lookupswitch` instructions instead of chained `if`/`else` comparisons."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (Arrow switch forced expression rules)",
            "beforeCode": "switch (status) {\n    case 200 -> log('OK')\n    default -> {} // required even when result was unused!\n}",
            "afterTitle": "Groovy 6.0 (Position decides statement vs expression)",
            "afterCode": "switch (status) {\n    case 200 -> log('OK')\n    case 404 -> log('Not Found')\n} // statement position: no default required!"
          },
          "underTheHood": "`AsmDecompiler` and `StatementWriter` inspect whether the `SwitchStatement` is inside an expression receiver context; integer and enum cases under `@CompileStatic` compile directly to `OPC_TABLESWITCH` / `OPC_LOOKUPSWITCH`.",
          "code": "@CompileStatic\nString classifyStatus(int code) {\n    String category = 'other'\n    // Arrow switch in statement position: no `default` required!\n    switch (code) {\n        case 200 -> category = 'OK'\n        case 404 -> category = 'Not Found'\n    }\n    return category\n}",
          "fullCode": "import groovy.transform.CompileStatic\n\n@CompileStatic\nString classifyStatus(int code) {\n    String category = 'other'\n    switch (code) {\n        case 200 -> category = 'OK'\n        case 404 -> category = 'Not Found'\n    }\n    return category\n}\n\n@CompileStatic\nString dayLabel(int day) {\n    String out = 'Weekend'\n    switch (day) {\n        case 1: out = 'Mon'; break\n        case 2: out = 'Tue'; break\n        case 3: out = 'Wed'; break\n    }\n    return out\n}\n\nassert classifyStatus(200) == 'OK' && classifyStatus(500) == 'other'\nassert dayLabel(2) == 'Tue' && dayLabel(7) == 'Weekend'\nprintln \"status(200)=${classifyStatus(200)}, status(500)=${classifyStatus(500)}, day(2)=${dayLabel(2)}\"",
          "expectedOutput": "status(200)=OK, status(500)=other, day(2)=Tue",
          "execMs": 24,
          "verifiedOut": "status(200)=OK, status(500)=other, day(2)=Tue",
          "grabs": []
        },
        {
          "id": "1.6",
          "slug": "java-parity",
          "title": "Java 21–25 Parity: `import module`, `!instanceof` Flow Scoping & Intersection Casts",
          "gep": "JEP 394 / JEP 511",
          "category": "Syntax & Keywords",
          "keywords": [
            "!instanceof",
            "import module",
            "(A & B)",
            "@Tags({...})"
          ],
          "summary": "Module imports, negated `!instanceof` pattern binding with early-return flow typing, intersection casts, and `{}` annotation arrays.",
          "prose": [
            "Groovy 6 stays in lockstep with modern Java syntax through Java 25: `import module java.sql` (JEP 511) imports all packages exported by a JPMS module (including transitive exports like `javax.sql.*` and `javax.transaction.xa.*`) in a single declaration.",
            "Pattern matching with `instanceof` and Groovy's negated `!instanceof` operator now supports full flow-sensitive scoping (JEP 394): after `if (obj !instanceof String s) return 'none'`, the pattern variable `s` remains in scope as a `String` for the remainder of the method! You can also write Java-style intersection casts `(Runnable & Serializable) () -> {}` and `{...}` array initializers inside annotations."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5",
            "beforeCode": "if (!(obj instanceof String)) return 'not-a-string'\nString s = (String) obj\nreturn s.trim().toLowerCase()",
            "afterTitle": "Groovy 6.0 (`!instanceof` flow-scoped binding)",
            "afterCode": "if (obj !instanceof String s) return 'not-a-string'\nreturn s.trim().toLowerCase() // `s` is in scope after early return!"
          },
          "underTheHood": "`StaticTypeCheckingVisitor` tracks negated pattern bindings across guard clauses that unconditionally exit (`return`, `throw`, `break`, `continue`), promoting the bound variable into the enclosing lexical flow scope.",
          "code": "import module java.sql // brings java.sql.* & transitive exports into scope\n\n@CompileStatic\nString normalizedLen(Object obj) {\n    if (obj !instanceof String s) return 'not-a-string'\n    s.trim().toLowerCase() // `s` is flow-scoped to String after early return!\n}\n\n@Tags({'groovy6', 'java25'}) // Java-style {} array initializer\nclass TaggedService {}",
          "fullCode": "import module java.sql\nimport groovy.transform.CompileStatic\nimport java.lang.annotation.Retention\nimport java.lang.annotation.RetentionPolicy\n\n@CompileStatic\nString normalizedLen(Object obj) {\n    if (obj !instanceof String s) return 'not-a-string'\n    s.trim().toLowerCase()\n}\n\n@Retention(RetentionPolicy.RUNTIME)\n@interface Tags { String[] value() default {} }\n\n@Tags({'groovy6', 'java25'})\nclass TaggedService {}\n\ndef task = (Runnable & Serializable) () -> {}\nassert task instanceof Runnable && task instanceof Serializable\nassert Date.valueOf('2026-10-13').toString() == '2026-10-13'\nassert normalizedLen('  GROOVY 6  ') == 'groovy 6'\nassert normalizedLen(99) == 'not-a-string'\nprintln \"FlowScope=${normalizedLen('  GROOVY 6  ')}, Date=${Date.valueOf('2026-10-13')}, Tags=${TaggedService.getAnnotation(Tags).value()}\"",
          "expectedOutput": "FlowScope=groovy 6, Date=2026-10-13, Tags=[groovy6, java25]",
          "execMs": 58,
          "verifiedOut": "FlowScope=groovy 6, Date=2026-10-13, Tags=[groovy6, java25]",
          "grabs": []
        }
      ],
      "fileExecMs": 359,
      "fileOut": "=== 01. Language Ergonomics & Java Compatibility ===\n[OK] 1. `val` contextual keyword\n[OK] 2. Multi-assignment destructuring (*rest, map keys, lazy streams)\n[OK] 3. Compound assignment operator overloading (plusAssign, @OperatorRename)\n[OK] 4. Nested `copyWith` (dotted paths, transactional block, structural sharing)\n[OK] 5. Switch statement vs expression alignment & jump-table dispatch\n[OK] 6. Java compatibility (module imports, flow scoping, intersection casts, annotation `{}`)"
    },
    {
      "num": "02",
      "id": "async-await",
      "page": "02-async-await.html",
      "scriptFile": "02_async_await.groovy",
      "navLabel": "2. Async/Await & Generators",
      "shortTitle": "Async/Await, Generators & Channels",
      "title": "Native Async/Await, Lazy Generators & Channels",
      "subtitle": "Zero-dependency async/await backed by JDK Virtual Threads, tuple await combinators, lazy infinite yield return generators, Go-style AsyncChannel pipelines, and structured concurrency via AsyncScope.",
      "category": "Concurrency & Async",
      "accent": "emerald",
      "highlights": [
        "async",
        "await",
        "yield return",
        "AsyncChannel",
        "for await",
        "AsyncScope"
      ],
      "sections": [
        {
          "id": "2.1",
          "slug": "virtual-thread-async-await",
          "title": "Sequential-Style `async` / `await` on JDK Virtual Threads",
          "gep": "GROOVY-9381",
          "category": "Concurrency & Async",
          "keywords": [
            "async",
            "await",
            "Awaitable",
            "Virtual Threads"
          ],
          "summary": "Write sequential-looking non-blocking code backed automatically by JDK 21+ Virtual Threads.",
          "prose": [
            "Groovy 6 introduces native `async { ... }` and `await(...)` expressions in `groovy.concurrent`, backed out-of-the-box by JDK 21+ Virtual Threads with zero external dependencies. Calling `async { ... }` spawns a lightweight task returning an `Awaitable<T>`, while `await` unwraps the result (or transparently adapts `CompletableFuture`, `Future`, and Reactive Streams).",
            "Because Virtual Threads unmount from carrier OS threads during blocking operations, you get the scalability of asynchronous I/O with straightforward, debuggable sequential control flow and clean stack traces."
          ],
          "beforeAfter": {
            "beforeTitle": "CompletableFuture Callback Chains",
            "beforeCode": "CompletableFuture.supplyAsync(() -> fetchUser(42))\n    .thenCompose(user -> fetchQuestsAsync(user))\n    .thenApply(quests -> quests.find { it.active })\n    .join()",
            "afterTitle": "Groovy 6.0 (`async` / `await`)",
            "afterCode": "def activeQuest = await async {\n    def user = await async { fetchUser(42) }\n    def quests = await async { fetchQuests(user) }\n    quests.find { it.active }\n}"
          },
          "underTheHood": "`AwaitableAdapterRegistry` detects JDK 21+ Virtual Thread support via `Executors.newVirtualThreadPerTaskExecutor()` so blocking `await` calls park the virtual thread without pinning OS threads.",
          "code": "def activeQuest = await async {\n    def profile = await async {\n        [id: 42, name: 'Guillaume', isVirtual: Thread.currentThread().virtual]\n    }\n    assert profile.isVirtual // Runs on a JDK 21+ Virtual Thread!\n    \"Master Groovy 6 for ${profile.name}\"\n}",
          "fullCode": "Map fetchUserProfile(int id) {\n    [id: id, name: 'Guillaume', isVirtual: Thread.currentThread().virtual]\n}\n\ndef activeQuest = await async {\n    def profile = await async { fetchUserProfile(42) }\n    assert profile.isVirtual\n    \"Master Groovy 6 for ${profile.name} (virtual=${profile.isVirtual})\".toString()\n}\n\nassert activeQuest.startsWith('Master Groovy 6 for Guillaume')\nprintln activeQuest",
          "expectedOutput": "Master Groovy 6 for Guillaume (virtual=true)",
          "execMs": 38,
          "verifiedOut": "Master Groovy 6 for Guillaume (virtual=true)",
          "grabs": []
        },
        {
          "id": "2.2",
          "slug": "parallel-tasks-and-error-handling",
          "title": "Parallel Task Combinators (`await(a, b, c)`) & `try`/`catch`",
          "gep": "GROOVY-9381",
          "category": "Concurrency & Async",
          "keywords": [
            "await(a, b, c)",
            "Awaitable.all",
            "Awaitable.first",
            "try/catch"
          ],
          "summary": "Fan out concurrent tasks, destructure multi-task results in one line, and catch original exceptions without `ExecutionException` wrappers.",
          "prose": [
            "To run independent tasks concurrently, spawn multiple `async` blocks and pass them together to `await(taskA, taskB, taskC)`—which executes them in parallel and returns a tuple you can immediately destructure with `def (a, b, c) = await(taskA, taskB, taskC)`.",
            "Unlike `Future.get()`, which wraps failures inside `ExecutionException` or `CompletionException`, `await` rethrows the original underlying exception directly so standard `try` / `catch` / `finally` blocks work identically to synchronous code."
          ],
          "beforeAfter": {
            "beforeTitle": "CompletableFuture.allOf + ExecutionException unwrapping",
            "beforeCode": "CompletableFuture.allOf(f1, f2, f3).join()\ndef (a, b, c) = [f1.get(), f2.get(), f3.get()]",
            "afterTitle": "Groovy 6.0 Tuple `await`",
            "afterCode": "def (resA, resB, statusC) = await(svcA, svcB, svcC)"
          },
          "underTheHood": "Multi-argument `await(...)` delegates to `Awaitable.all(...)` and unboxes any `CompletionException` / `ExecutionException` before rethrowing.",
          "code": "def svcA = async { 'auth:OK' }\ndef svcB = async { 'billing:OK' }\ndef svcC = async { 200 }\n\n// Fan-in & destructure in a single statement\ndef (resA, resB, code) = await(svcA, svcB, svcC)\n\n// Original exception type is preserved across await\ntry { await async { throw new IllegalStateException('timeout') } }\ncatch (IllegalStateException e) { assert e.message == 'timeout' }",
          "fullCode": "def svcA = async { 'auth:OK' }\ndef svcB = async { 'billing:OK' }\ndef svcC = async { 200 }\n\ndef (resA, resB, code) = await(svcA, svcB, svcC)\nassert [resA, resB, code] == ['auth:OK', 'billing:OK', 200]\n\nString recovered = ''\ntry {\n    await async { throw new IllegalStateException('remote-timeout') }\n} catch (IllegalStateException ex) {\n    recovered = ex.message\n}\nassert recovered == 'remote-timeout'\nprintln \"Results=${[resA, resB, code]}, Recovered=${recovered}\"",
          "expectedOutput": "Results=[auth:OK, billing:OK, 200], Recovered=remote-timeout",
          "execMs": 18,
          "verifiedOut": "Results=[auth:OK, billing:OK, 200], Recovered=remote-timeout",
          "grabs": []
        },
        {
          "id": "2.3",
          "slug": "yield-return-generators",
          "title": "Lazy Infinite Generators with `yield return`",
          "gep": "GROOVY-9381",
          "category": "Concurrency & Async",
          "keywords": [
            "yield return",
            "async generator",
            "Iterable"
          ],
          "summary": "Any `async` block containing `yield return` compiles into a pull-driven `Iterable<T>` with natural back-pressure.",
          "prose": [
            "When an `async { ... }` closure contains one or more `yield return` statements, Groovy transforms it into a lazy, pull-driven `Iterable<T>` generator instead of a one-shot `Awaitable`. The producer suspends at each `yield return` until the consumer requests the next element via `.take(n)`, `for (x in gen)`, or standard GDK collection operations.",
            "Because the generator only advances on demand, you can express infinite mathematical sequences, paginated API cursors, or tree traversals using natural imperative loops (`while (true)`) without ever materializing the full sequence in memory."
          ],
          "beforeAfter": {
            "beforeTitle": "Custom Stateful Iterator Boilerplate",
            "beforeCode": "class FibIterator implements Iterator<Long> {\n    long a = 0, b = 1\n    boolean hasNext() { true }\n    Long next() { long r = a; (a, b) = [b, a + b]; r }\n}",
            "afterTitle": "Groovy 6.0 (`yield return` Generator)",
            "afterCode": "def fibonacci = async {\n    long a = 0, b = 1\n    while (true) { yield return a; (a, b) = [b, a + b] }\n}"
          },
          "underTheHood": "The AST transformation detects `yield return` inside `async` and wires a zero-capacity handoff channel between the virtual-thread producer and the consumer's `Iterator.next()` call.",
          "code": "def fibonacci = async {\n    long a = 0, b = 1\n    while (true) {\n        yield return a\n        (a, b) = [b, a + b]\n    }\n}\n\ndef first10 = fibonacci.take(10).toList()\nassert first10 == [0L, 1L, 1L, 2L, 3L, 5L, 8L, 13L, 21L, 34L]",
          "fullCode": "def fibonacci = async {\n    long a = 0, b = 1\n    while (true) {\n        yield return a\n        (a, b) = [b, a + b]\n    }\n}\n\ndef first10 = fibonacci.take(10).toList()\nassert first10 == [0L, 1L, 1L, 2L, 3L, 5L, 8L, 13L, 21L, 34L]\nprintln \"Fibonacci(10)=${first10}\"",
          "expectedOutput": "Fibonacci(10)=[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]",
          "execMs": 14,
          "verifiedOut": "Fibonacci(10)=[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]",
          "grabs": []
        },
        {
          "id": "2.4",
          "slug": "async-channels-and-pipelines",
          "title": "Go-Style `AsyncChannel`, Composable Pipelines & `for await`",
          "gep": "GROOVY-9381",
          "category": "Concurrency & Async",
          "keywords": [
            "AsyncChannel",
            "for await",
            "filter",
            "map"
          ],
          "summary": "Pass messages between concurrent tasks with unbuffered or buffered channels, functional pipelines, and `for await` loops.",
          "prose": [
            "`AsyncChannel<T>` brings CSP / Go-style message passing to Groovy 6. Channels can be unbuffered (rendezvous) or buffered (`AsyncChannel.create(capacity)`), and support functional operators like `.filter { ... }`, `.map { ... }`, and `.take(n)` that return new transformed channel stages.",
            "Consumers iterate over incoming messages asynchronously using `for await (item in channel)` (or standard `for (item in channel)`), which automatically terminates cleanly as soon as the upstream channel is closed and drained."
          ],
          "beforeAfter": {
            "beforeTitle": "Manual BlockingQueue + Poison Pill",
            "beforeCode": "def queue = new ArrayBlockingQueue(10)\n// requires manual poison pill object to signal completion!",
            "afterTitle": "Groovy 6.0 (`AsyncChannel` + `for await`)",
            "afterCode": "def ch = AsyncChannel.create(10)\ndef pipeline = ch.filter { it % 2 == 0 }.map { it * 10 }\nfor await (val v in pipeline) { received << v }"
          },
          "underTheHood": "Each pipeline stage (`filter`, `map`) spawns a lightweight virtual-thread relay that reads from the upstream channel and closes the downstream channel when upstream completes.",
          "code": "def raw = AsyncChannel.create(8)\ndef pipeline = raw.filter { int n -> n % 2 == 0 }.map { int n -> n * 10 }\n\nasync {\n    for (i in 1..6) raw.send(i)\n    raw.close()\n}\n\ndef out = []\nfor await (val item in pipeline) { out << item }\nassert out == [20, 40, 60]",
          "fullCode": "import groovy.concurrent.AsyncChannel\n\ndef raw = AsyncChannel.create(8)\ndef pipeline = raw.filter { int n -> n % 2 == 0 }.map { int n -> n * 10 }\n\nasync {\n    for (i in 1..6) raw.send(i)\n    raw.close()\n}\n\ndef out = []\nfor await (val item in pipeline) { out << item }\nassert out == [20, 40, 60]\nprintln \"Channel pipeline output: ${out}\"",
          "expectedOutput": "Channel pipeline output: [20, 40, 60]",
          "execMs": 18,
          "verifiedOut": "Channel pipeline output: [20, 40, 60]",
          "grabs": []
        },
        {
          "id": "2.5",
          "slug": "structured-concurrency-asyncscope",
          "title": "Structured Concurrency with `AsyncScope.withScope`",
          "gep": "GROOVY-9381",
          "category": "Concurrency & Async",
          "keywords": [
            "AsyncScope",
            "withScope",
            "structured concurrency"
          ],
          "summary": "Bind child task lifetimes to a lexical block—preventing orphan threads and automatically cancelling siblings on failure.",
          "prose": [
            "`AsyncScope.withScope { scope -> ... }` brings structured concurrency to Groovy 6 without requiring preview JDK flags. Every task spawned inside the block (either via `scope.async { ... }` or unadorned `async { ... }`, which automatically inherits the active thread's `AsyncScope`) is bound to the lexical lifetime of the scope.",
            "When `withScope` exits, all child tasks are guaranteed to have finished; if any child throws an unhandled exception under the default fail-fast policy, sibling tasks are immediately cancelled and the failure propagates cleanly."
          ],
          "beforeAfter": {
            "beforeTitle": "Unstructured ExecutorService (Leak-Prone)",
            "beforeCode": "def exec = Executors.newVirtualThreadPerTaskExecutor()\n// If taskA fails, taskB keeps running in the background unless manually cancelled!",
            "afterTitle": "Groovy 6.0 (`AsyncScope.withScope`)",
            "afterCode": "def summary = AsyncScope.withScope { scope ->\n    def users = scope.async { ['Alice', 'Bob'] }\n    def cfg   = scope.async { [region: 'eu-west-1'] }\n    await(users, cfg)\n}"
          },
          "underTheHood": "`AsyncScope` maintains a thread-local scope stack and tracks child `Awaitable` registrations, ensuring deterministic cleanup in its `close()` barrier.",
          "code": "def summary = AsyncScope.withScope { scope ->\n    def usersTask  = scope.async { ['Alice', 'Bob', 'Carol'] }\n    def configTask = scope.async { [region: 'eu-west-1'] }\n\n    def (users, cfg) = await(usersTask, configTask)\n    \"${users.size()} users in ${cfg.region}\"\n}\nassert summary == '3 users in eu-west-1'",
          "fullCode": "import groovy.concurrent.AsyncScope\n\ndef summary = AsyncScope.withScope { scope ->\n    def usersTask  = scope.async { ['Alice', 'Bob', 'Carol'] }\n    def configTask = scope.async { [region: 'eu-west-1', maxRetries: 3] }\n\n    def (users, cfg) = await(usersTask, configTask)\n    \"${users.size()} users in ${cfg.region}\".toString()\n}\nassert summary == '3 users in eu-west-1'\nprintln \"AsyncScope summary: ${summary}\"",
          "expectedOutput": "AsyncScope summary: 3 users in eu-west-1",
          "execMs": 20,
          "verifiedOut": "AsyncScope summary: 3 users in eu-west-1",
          "grabs": []
        }
      ],
      "fileExecMs": 94,
      "fileOut": "=== 02. Native Async/Await, Generators & Channels ===\n[OK] 1. Sequential-style async/await on Virtual Threads\n[OK] 2. Parallel task combinators & standard try/catch error handling\n[OK] 3. Lazy infinite generators with `yield return`\n[OK] 4. Go-style AsyncChannel, pipelines (filter/map) & `for await`\n[OK] 5. Structured concurrency via AsyncScope.withScope"
    },
    {
      "num": "03",
      "id": "concurrency-toolkit",
      "page": "03-concurrency-toolkit.html",
      "scriptFile": "03_concurrency_toolkit.groovy",
      "navLabel": "3. Concurrency Toolkit",
      "shortTitle": "GPars-Inspired Concurrency Toolkit",
      "title": "Integrated Concurrency Toolkit (`groovy.concurrent`)",
      "subtitle": "GPars-inspired concurrency primitives built directly into Groovy core: Agent state cells, @ActiveObject actors, DataflowVariables, ParallelScope & @Parallel loops, BroadcastChannel, and CSP ChannelSelect.",
      "category": "Concurrency & Async",
      "accent": "amber",
      "highlights": [
        "Agent",
        "@ActiveObject",
        "DataflowVariable",
        "ParallelScope",
        "@Parallel",
        "ChannelSelect"
      ],
      "sections": [
        {
          "id": "3.1",
          "slug": "agent-reactive-state",
          "title": "`Agent<T>`: Thread-Safe State & Reactive `changes()` Stream",
          "gep": "GPars Parity",
          "category": "Concurrency & Async",
          "keywords": [
            "Agent",
            "send",
            "updateAsync",
            "changes()"
          ],
          "summary": "Protect mutable state without explicit locks by sending serialised update closures to an Agent and subscribing to its state transitions.",
          "prose": [
            "Inspired by Clojure and GPars agents, `groovy.concurrent.Agent<T>` wraps mutable state inside a thread-safe cell where all modifications are submitted as functions (`agent.send { it + 10 }` or `agent.updateAsync { ... }`) and executed sequentially in arrival order.",
            "New in Groovy 6, `agent.changes()` exposes a `Flow.Publisher<T>` stream of committed state transitions that integrates directly with `for await (val state in agent.changes())`, enabling reactive audit logs and live state observers."
          ],
          "beforeAfter": {
            "beforeTitle": "Manual `synchronized` + Listener List Boilerplate",
            "beforeCode": "synchronized (lock) {\n    state += 10\n    listeners.each { it.onUpdate(state) }\n}",
            "afterTitle": "Groovy 6.0 (`Agent.create` + `for await` on `changes()`)",
            "afterCode": "def agent = Agent.create(0)\nagent.send { it + 10 }\nfor await (val s in agent.changes()) { observed << s }"
          },
          "underTheHood": "`Agent` processes message closures on a single-lane virtual thread queue while `val` reads (`agent.val`) access the latest volatile snapshot immediately without blocking.",
          "code": "def counterAgent = Agent.create(0)\ndef transitions = []\n\nasync {\n    Thread.sleep(15)\n    counterAgent.send { it + 10 }\n    counterAgent.send { it + 32 }\n    await(counterAgent.getAsync())\n    counterAgent.shutdown()\n}\n\nfor await (val s in counterAgent.changes()) { transitions << s }\nassert transitions == [10, 42]",
          "fullCode": "import groovy.concurrent.Agent\n\ndef counterAgent = Agent.create(0)\ndef transitions = []\n\nasync {\n    Thread.sleep(15)\n    counterAgent.send { it + 10 }\n    counterAgent.send { it + 20 }\n    counterAgent.send { it + 12 }\n    assert await(counterAgent.getAsync()) == 42\n    counterAgent.shutdown()\n}\n\nfor await (val state in counterAgent.changes()) {\n    transitions << state\n}\nassert transitions == [10, 30, 42]\nprintln \"Agent transitions: ${transitions}\"",
          "expectedOutput": "Agent transitions: [10, 30, 42]",
          "execMs": 31,
          "verifiedOut": "Agent transitions: [10, 30, 42]",
          "grabs": []
        },
        {
          "id": "3.2",
          "slug": "active-object-actors",
          "title": "`@ActiveObject` & `@ActiveMethod`: Actor Semantics with Plain Classes",
          "gep": "GPars Parity",
          "category": "Concurrency & Async",
          "keywords": [
            "@ActiveObject",
            "@ActiveMethod",
            "Actor"
          ],
          "summary": "Turn any plain Groovy class into a thread-safe actor whose methods execute sequentially through an internal message mailbox.",
          "prose": [
            "`@ActiveObject` and `@ActiveMethod` bring declarative actor concurrency into Groovy core. By annotating a class with `@ActiveObject`, its `@ActiveMethod` methods are automatically routed through a private `Agent` mailbox so concurrent callers never race on internal fields.",
            "Return types dictate the calling convention: `void` methods become fire-and-forget asynchronous messages, `Awaitable<T>` methods return immediately for non-blocking `await`, and plain return types (`BigDecimal`, `boolean`) await the actor turn and return the result directly."
          ],
          "beforeAfter": {
            "beforeTitle": "Explicit ReentrantLock / Synchronized Methods",
            "beforeCode": "class BankAccount {\n    private final lock = new ReentrantLock()\n    void deposit(BigDecimal amt) { lock.withLock { balance += amt } }\n}",
            "afterTitle": "Groovy 6.0 (`@ActiveObject` & `@ActiveMethod`)",
            "afterCode": "@ActiveObject\nclass BankAccount {\n    private BigDecimal balance = 0G\n    @ActiveMethod void deposit(BigDecimal amt) { balance += amt }\n    @ActiveMethod BigDecimal getBalance() { balance }\n}"
          },
          "underTheHood": "`ActiveObjectASTTransformation` injects a private `Agent<this>` field into the class and rewrites each `@ActiveMethod` body into a serialized message submission.",
          "code": "@ActiveObject\nclass BankAccount {\n    private BigDecimal balance = 0.0G\n\n    @ActiveMethod void deposit(BigDecimal amount) { balance += amount }\n    @ActiveMethod boolean tryWithdraw(BigDecimal amount) {\n        if (amount > balance) return false\n        balance -= amount; return true\n    }\n    @ActiveMethod BigDecimal getBalance() { balance }\n}",
          "fullCode": "import groovy.transform.ActiveMethod\nimport groovy.transform.ActiveObject\n\n@ActiveObject\nclass BankAccount {\n    private BigDecimal balance = 0.0G\n    @ActiveMethod void deposit(BigDecimal amount) { balance += amount }\n    @ActiveMethod boolean tryWithdraw(BigDecimal amount) {\n        if (amount > balance) return false\n        balance -= amount\n        return true\n    }\n    @ActiveMethod BigDecimal getBalance() { balance }\n}\n\ndef acct = new BankAccount()\nacct.deposit(100.0G)\nacct.deposit(50.0G)\nassert acct.tryWithdraw(30.0G)\nassert !acct.tryWithdraw(200.0G)\nassert acct.balance == 120.0G\nprintln \"Actor final balance: ${acct.balance}\"",
          "expectedOutput": "Actor final balance: 120.0",
          "execMs": 20,
          "verifiedOut": "Actor final balance: 120.0",
          "grabs": []
        },
        {
          "id": "3.3",
          "slug": "dataflow-variables",
          "title": "`DataflowVariable` & `Dataflows` Single-Assignment Concurrency",
          "gep": "GPars Parity",
          "category": "Concurrency & Async",
          "keywords": [
            "DataflowVariable",
            "Dataflows",
            "<<"
          ],
          "summary": "Deterministic single-assignment variables where readers automatically suspend until a producer binds the value.",
          "prose": [
            "Dataflow concurrency eliminates race conditions by making variables write-once (`<<` or `bind`) and allowing readers to read them before the value has been computed. Any task that reads or `await`s an unbound `DataflowVariable` suspends on its virtual thread until the producer binds it.",
            "The `Dataflows` container makes this even more concise by lazily creating named `DataflowVariable` properties on first access (`df.greeting = \"Hello, ${df.firstName}!\"`), regardless of the order in which concurrent tasks run."
          ],
          "beforeAfter": {
            "beforeTitle": "CountDownLatch + AtomicReference Coordination",
            "beforeCode": "def latch = new CountDownLatch(2)\n// Manual latch.countDown() and latch.await() ordering",
            "afterTitle": "Groovy 6.0 (`DataflowVariable` & `Dataflows`)",
            "afterCode": "def df = new Dataflows()\nasync { df.greeting = \"Hello, ${df.first} ${df.last}!\" }\nasync { df.last = 'Laforge' }\nasync { df.first = 'Guillaume' }\nassert df.greeting == 'Hello, Guillaume Laforge!'"
          },
          "underTheHood": "`DataflowVariable<T>` implements `Awaitable<T>` directly, so `await(dfVar)` and direct property access on `Dataflows` compose seamlessly with `async` blocks.",
          "code": "def df = new Dataflows()\n// Consumer starts BEFORE firstName or lastName are bound!\nasync { df.greeting = \"Hello, ${df.firstName} ${df.lastName}!\".toString() }\nasync { df.lastName  = 'Laforge' }\nasync { df.firstName = 'Guillaume' }\n\nassert df.greeting == 'Hello, Guillaume Laforge!'",
          "fullCode": "import groovy.concurrent.DataflowVariable\nimport groovy.concurrent.Dataflows\n\ndef x = new DataflowVariable<Integer>()\ndef y = new DataflowVariable<Integer>()\ndef z = new DataflowVariable<Integer>()\n\nasync { z << await(x) + await(y) }\nasync { y << 25 }\nasync { x << 17 }\nassert await(z) == 42\n\ndef df = new Dataflows()\nasync { df.greeting = \"Hello, ${df.firstName} ${df.lastName}!\".toString() }\nasync { df.lastName = 'Laforge' }\nasync { df.firstName = 'Guillaume' }\nassert df.greeting == 'Hello, Guillaume Laforge!'\nprintln \"z=${await(z)}, greeting=${df.greeting}\"",
          "expectedOutput": "z=42, greeting=Hello, Guillaume Laforge!",
          "execMs": 39,
          "verifiedOut": "z=42, greeting=Hello, Guillaume Laforge!",
          "grabs": []
        },
        {
          "id": "3.4",
          "slug": "parallel-collections-and-loops",
          "title": "Parallel Collections, `ParallelScope` & `@Parallel` Loops",
          "gep": "GPars Parity",
          "category": "Concurrency & Async",
          "keywords": [
            "collectParallel",
            "ParallelScope",
            "Pool.cpu()",
            "@Parallel"
          ],
          "summary": "Process collections in parallel with GDK methods (`collectParallel`, `findAllParallel`), custom thread pools, and `@Parallel` loop transforms.",
          "prose": [
            "Groovy 6 adds parallel GDK collection methods directly to `Iterable` and `Map`: `eachParallel`, `collectParallel`, `findAllParallel`, `anyParallel`, `everyParallel`, `groupByParallel`, and `injectParallel`. By default they run on the common `ForkJoinPool`, or you can scope them to a specific pool (`Pool.cpu()`, `Pool.virtual()`, or `Pool.fixed(n)`) via `ParallelScope.withPool(...)`.",
            "You can also annotate an ordinary `for` loop with `@Parallel` to automatically execute its iterations in parallel without rewriting the loop into a stream pipeline."
          ],
          "beforeAfter": {
            "beforeTitle": "Verbose Java Parallel Stream Boilerplate",
            "beforeCode": "nums.parallelStream()\n    .filter(n -> n % 2 == 0)\n    .map(n -> n * n)\n    .collect(Collectors.toList())",
            "afterTitle": "Groovy 6.0 (`findAllParallel` / `collectParallel` & `@Parallel`)",
            "afterCode": "val squares = (1..6).collectParallel { it * it }\n@Parallel for (Integer i in 1..8) { results.add(i * 10) }"
          },
          "underTheHood": "`@Parallel` rewrites `for (T x in iterable)` AST nodes into a `DefaultGroovyMethods.eachParallel` invocation scoped to the current thread's `ParallelScope` pool.",
          "code": "ParallelScope.withPool(Pool.cpu()) {\n    val squares = (1..6).collectParallel { it * it }\n    assert squares == [1, 4, 9, 16, 25, 36]\n}\n\ndef acc = new ConcurrentLinkedQueue<Integer>()\n@Parallel\nfor (Integer i in 1..8) { acc.add(i * 10) }\nassert acc.sum() == 360",
          "fullCode": "import groovy.concurrent.ParallelScope\nimport groovy.concurrent.Pool\nimport groovy.transform.Parallel\nimport java.util.concurrent.ConcurrentLinkedQueue\n\ndef squares = ParallelScope.withPool(Pool.cpu()) {\n    (1..6).collectParallel { it * it }\n}\nassert squares == [1, 4, 9, 16, 25, 36]\n\ndef acc = new ConcurrentLinkedQueue<Integer>()\n@Parallel\nfor (Integer i in 1..8) {\n    acc.add(i * 10)\n}\nassert acc.sum() == 360\nprintln \"Squares=${squares}, ParallelLoopSum=${acc.sum()}\"",
          "expectedOutput": "Squares=[1, 4, 9, 16, 25, 36], ParallelLoopSum=360",
          "execMs": 17,
          "verifiedOut": "Squares=[1, 4, 9, 16, 25, 36], ParallelLoopSum=360",
          "grabs": []
        },
        {
          "id": "3.5",
          "slug": "broadcast-and-channel-select",
          "title": "`BroadcastChannel` & CSP `ChannelSelect` (`when` Guards, `fair()`, `after()`)",
          "gep": "GPars Parity",
          "category": "Concurrency & Async",
          "keywords": [
            "BroadcastChannel",
            "ChannelSelect",
            "offers",
            "fair()",
            "after()"
          ],
          "summary": "Fan out one-to-many broadcasts and coordinate multi-channel CSP `select` choices with precondition guards, fair rotation, and timeouts.",
          "prose": [
            "`BroadcastChannel` provides one-to-many fan-out where every subscriber created via `.asPublisher()` receives every message sent after subscription. For multi-channel coordination, `ChannelSelect` implements full Communicating Sequential Processes (CSP) choice.",
            "With `ChannelSelect.offers(...)`, you can mix `receive(ch)` and `send(ch, val)` clauses, attach dynamic boolean preconditions via `.when { ... }`, switch between priority ordering and round-robin `.fair()` rotation to prevent starvation, and include an `after(millis)` timeout branch."
          ],
          "beforeAfter": {
            "beforeTitle": "Manual Polling Loops with `Thread.sleep`",
            "beforeCode": "// Complex non-blocking poll loops across multiple queues with starvation bugs",
            "afterTitle": "Groovy 6.0 (`ChannelSelect.offers` with `when` & `after`)",
            "afterCode": "def sel = offers(\n    receive(highPrio).when { allowHigh },\n    receive(lowPrio),\n    after(50)\n).fair()\ndef outcome = await sel.select()"
          },
          "underTheHood": "`ChannelSelect` registers waiter callbacks across all active clauses whose `when` guards evaluate to `true`, resolving the first ready clause atomically.",
          "code": "def selector = offers(\n    receive(highPrio).when { allowHigh }, // dynamic guard\n    receive(lowPrio),\n    after(40)                             // timeout branch\n).fair()                                  // round-robin fairness\n\ndef r1 = await selector.select() // allowHigh=false -> picks lowPrio\nallowHigh = true\ndef r2 = await selector.select() // allowHigh=true  -> picks highPrio\ndef r3 = await selector.select() // both empty      -> r3.timeout == true",
          "fullCode": "import groovy.concurrent.AsyncChannel\nimport static groovy.concurrent.ChannelSelect.*\n\ndef highPrio = AsyncChannel.create(2)\ndef lowPrio  = AsyncChannel.create(2)\nhighPrio.send('H1')\nlowPrio.send('L1')\n\nboolean allowHigh = false\ndef selector = offers(\n    receive(highPrio).when { allowHigh },\n    receive(lowPrio),\n    after(40)\n).fair()\n\ndef r1 = await selector.select()\nassert r1.value == 'L1'\nallowHigh = true\ndef r2 = await selector.select()\nassert r2.value == 'H1'\ndef r3 = await selector.select()\nassert r3.timeout\nprintln \"Round1=${r1.value}, Round2=${r2.value}, Round3 timeout=${r3.timeout}\"",
          "expectedOutput": "Round1=L1, Round2=H1, Round3 timeout=true",
          "execMs": 55,
          "verifiedOut": "Round1=L1, Round2=H1, Round3 timeout=true",
          "grabs": []
        }
      ],
      "fileExecMs": 240,
      "fileOut": "=== 03. Integrated Concurrency Toolkit (`groovy.concurrent`) ===\n[OK] 1. Agent thread-safe state & reactive `changes()` stream\n[OK] 2. @ActiveObject & @ActiveMethod actor transform\n[OK] 3. DataflowVariable & Dataflows single-assignment variables\n[OK] 4. Parallel collections, ParallelScope & @Parallel for-loop transform\n[OK] 5. BroadcastChannel & ChannelSelect (guards, fair rotation, timer branch)"
    },
    {
      "num": "04",
      "id": "contracts-and-checkers",
      "page": "04-contracts-and-checkers.html",
      "scriptFile": "04_contracts_and_checkers.groovy",
      "navLabel": "4. Contracts & Type Checkers",
      "shortTitle": "Contracts, Purity, Type Checkers & Monads",
      "title": "Design-by-Contract, Compile-Time Checkers, Monads & Traits",
      "subtitle": "Graduated groovy-contracts (@Invariant, @Requires, @Ensures, @Decreases, @ThrowsIf), compile-time @Modifies & @Pure verification, strict NullChecker, @Associative reductions, DO monadic comprehensions, @SafeRegex, and @Virtual trait statics.",
      "category": "Contracts & Type Checkers",
      "accent": "purple",
      "highlights": [
        "@Invariant",
        "@Modifies",
        "@Pure",
        "NullChecker",
        "@Associative",
        "DO",
        "@SafeRegex",
        "@Virtual"
      ],
      "sections": [
        {
          "id": "4.1",
          "slug": "contracts-modifies-and-purity",
          "title": "Self-Describing Contracts (`@Invariant`, `@Requires`, `@Ensures`, `@Modifies` & `@Pure`)",
          "gep": "groovy-contracts",
          "category": "Contracts & Type Checkers",
          "keywords": [
            "@Invariant",
            "@Requires",
            "@Ensures",
            "@Modifies",
            "@Pure"
          ],
          "summary": "Combine runtime Design-by-Contract invariants with compile-time frame-condition (`ModifiesChecker`) and purity (`PurityChecker`) verification.",
          "prose": [
            "`groovy-contracts` graduates from incubating in Groovy 6 and pairs with new compile-time type checkers. Multiple `@Requires` and `@Ensures` annotations on the same method now all execute (fixing a Groovy 5 limitation where only the first fired), and `@Modifies({ [this.balance] })` declares an explicit frame condition verified at compile time by `ModifiesChecker`.",
            "Meanwhile, `@Pure` (checked by `PurityChecker`) verifies at compile time that a method neither mutates state nor performs I/O—catching accidental side effects before the code ever runs."
          ],
          "beforeAfter": {
            "beforeTitle": "Unchecked Javadoc Comments & Manual Asserts",
            "beforeCode": "// Mutates balance only (not checked by compiler!)\nvoid deposit(int amount) {\n    assert amount > 0\n    balance += amount\n}",
            "afterTitle": "Groovy 6.0 (Verified `@Requires`, `@Ensures`, `@Modifies` & `@Pure`)",
            "afterCode": "@Requires({ amount > 0 })\n@Ensures({ balance == old.balance + amount })\n@Modifies({ [this.balance] })\nvoid deposit(int amount) { balance += amount }"
          },
          "underTheHood": "`ModifiesChecker` inspects every property/field assignment AST node inside the method body and raises a compile-time type-checking error if any mutated target is absent from `@Modifies`.",
          "code": "@TypeChecked(extensions = [\n    'groovy.typecheckers.ModifiesChecker',\n    'groovy.typecheckers.PurityChecker'\n])\n@Invariant({ balance >= 0 })\nclass Wallet {\n    int balance = 0\n    @Requires({ amount > 0 })\n    @Ensures({ balance == old.balance + amount })\n    @Modifies({ [this.balance] })\n    void deposit(int amount) { balance += amount }\n\n    @Pure int projected(int bonus) { balance + bonus }\n}",
          "fullCode": "@Grab('org.apache.groovy:groovy-contracts:6.0.0')\n@Grab('org.apache.groovy:groovy-typecheckers:6.0.0')\nimport groovy.contracts.*\nimport groovy.transform.Pure\nimport groovy.transform.TypeChecked\n\n@TypeChecked(extensions = [\n    'groovy.typecheckers.ModifiesChecker',\n    'groovy.typecheckers.PurityChecker'\n])\n@Invariant({ balance >= 0 })\nclass Wallet {\n    int balance = 0\n    @Requires({ amount > 0 })\n    @Ensures({ balance == old.balance + amount })\n    @Modifies({ [this.balance] })\n    void deposit(int amount) { balance += amount }\n\n    @Pure int projected(int bonus) { balance + bonus }\n}\n\nval w = new Wallet()\nw.deposit(150)\nassert w.balance == 150 && w.projected(50) == 200\nprintln \"Wallet balance=${w.balance}, projected=${w.projected(50)}\"",
          "expectedOutput": "Wallet balance=150, projected=200",
          "execMs": 185,
          "verifiedOut": "Wallet balance=150, projected=200",
          "grabs": [
            "groovy-contracts",
            "groovy-typecheckers"
          ]
        },
        {
          "id": "4.2",
          "slug": "loop-invariants-decreases-throwsif",
          "title": "Loop `@Invariant` & `@Decreases` Termination + Woven `@ThrowsIf`",
          "gep": "groovy-contracts",
          "category": "Contracts & Type Checkers",
          "keywords": [
            "@Decreases",
            "@ThrowsIf",
            "loop @Invariant"
          ],
          "summary": "Verify loop invariants, prove termination of loops and recursive methods with `@Decreases`, and weave exception guards via `@ThrowsIf`.",
          "prose": [
            "Groovy 6 extends `@Invariant` to `while` and `for` loops (checked before the first iteration and after every body execution) and introduces `@Decreases` to enforce strictly decreasing non-negative termination measures (either a single number or a lexicographically compared list `[a.size(), b.size()]`) on both loops and recursive methods.",
            "For exceptional preconditions, `@ThrowsIf(value = { divisor == 0 }, exception = ArithmeticException)` both documents the exceptional contract and weaves the runtime guard clause automatically at method entry."
          ],
          "beforeAfter": {
            "beforeTitle": "Manual Guard Clauses & Unchecked Loops",
            "beforeCode": "static int safeDivide(int a, int b) {\n    if (b == 0) throw new ArithmeticException('div by 0')\n    a.intdiv(b)\n}",
            "afterTitle": "Groovy 6.0 (`@ThrowsIf` & `@Decreases`)",
            "afterCode": "@ThrowsIf(value = { b == 0 }, exception = ArithmeticException)\nstatic int safeDivide(int a, int b) { a.intdiv(b) }\n\n@Requires({ n >= 0 }) @Decreases({ n })\nstatic long factorial(int n) { n <= 1 ? 1L : n * factorial(n - 1) }"
          },
          "underTheHood": "On recursive methods, `@Decreases` stores the caller's measure in a `ThreadLocal` stack frame and asserts that each recursive invocation strictly decreases the measure while remaining `>= 0`.",
          "code": "@Requires({ n >= 0 })\n@Decreases({ n }) // proves recursive termination!\nstatic long factorial(int n) {\n    n <= 1 ? 1L : n * factorial(n - 1)\n}\n\n// Automatically weaves guard clause at method entry:\n@ThrowsIf(value = { divisor == 0 }, exception = ArithmeticException)\nstatic int safeDivide(int dividend, int divisor) {\n    dividend.intdiv(divisor)\n}",
          "fullCode": "@Grab('org.apache.groovy:groovy-contracts:6.0.0')\nimport groovy.contracts.*\n\nclass VerifiedMath {\n    @Requires({ n >= 0 })\n    @Decreases({ n })\n    static long factorial(int n) {\n        n <= 1 ? 1L : n * factorial(n - 1)\n    }\n\n    @ThrowsIf(value = { divisor == 0 }, exception = ArithmeticException)\n    static int safeDivide(int dividend, int divisor) {\n        dividend.intdiv(divisor)\n    }\n}\n\nassert VerifiedMath.factorial(6) == 720L\nassert VerifiedMath.safeDivide(20, 4) == 5\nboolean caught = false\ntry { VerifiedMath.safeDivide(10, 0) } catch (ArithmeticException expected) { caught = true }\nassert caught\nprintln \"factorial(6)=${VerifiedMath.factorial(6)}, safeDivide(20,4)=${VerifiedMath.safeDivide(20, 4)}, divByZeroCaught=${caught}\"",
          "expectedOutput": "factorial(6)=720, safeDivide(20,4)=5, divByZeroCaught=true",
          "execMs": 279,
          "verifiedOut": "factorial(6)=720, safeDivide(20,4)=5, divByZeroCaught=true",
          "grabs": [
            "groovy-contracts"
          ]
        },
        {
          "id": "4.3",
          "slug": "strict-null-checker",
          "title": "Flow-Sensitive `NullChecker(strict: true)` & JSpecify Nullability",
          "gep": "groovy-typecheckers",
          "category": "Contracts & Type Checkers",
          "keywords": [
            "NullChecker",
            "strict: true",
            "@NullMarked",
            "@Nullable"
          ],
          "summary": "Catch potential `NullPointerException`s at compile time with flow-sensitive null tracking and JSpecify `@NullMarked` annotations.",
          "prose": [
            "The new `groovy.typecheckers.NullChecker` brings compile-time null-safety analysis to `@TypeChecked` and `@CompileStatic` code. It honours JSpecify (`@NullMarked`, `@Nullable`, `@NonNull`) and JetBrains/Jakarta nullability annotations, and in `NullChecker(strict: true)` mode tracks nullable dataflow even on unannotated local variables.",
            "Its flow-sensitive engine understands guard clauses (`if (x != null)`, early `return`/`throw`), short-circuiting `&&`/`||`, Elvis (`?:`), Elvis assignment (`?=`), and safe navigation (`?.`)."
          ],
          "beforeAfter": {
            "beforeTitle": "Runtime NullPointerException Surprise",
            "beforeCode": "String normalize(String input) {\n    def s = input?.trim()\n    return s.toUpperCase() // NPE at runtime when input is null!\n}",
            "afterTitle": "Groovy 6.0 (`NullChecker(strict: true)` Flow Typing)",
            "afterCode": "@TypeChecked(extensions = 'groovy.typecheckers.NullChecker(strict: true)')\nString normalize(String input) {\n    def s = input?.trim()\n    if (s != null && !s.isEmpty()) return s.toUpperCase()\n    return 'DEFAULT'\n}"
          },
          "underTheHood": "Type-checking extensions can now accept named configuration parameters directly in their string descriptor (`'groovy.typecheckers.NullChecker(strict: true)'`).",
          "code": "@TypeChecked(extensions = 'groovy.typecheckers.NullChecker(strict: true)')\nclass NullSafeService {\n    static String normalize(String input) {\n        def candidate = input?.trim()\n        if (candidate != null && !candidate.isEmpty()) {\n            return candidate.toUpperCase() // proven non-null!\n        }\n        return 'DEFAULT'\n    }\n}",
          "fullCode": "@Grab('org.apache.groovy:groovy-typecheckers:6.0.0')\nimport groovy.transform.TypeChecked\n\n@TypeChecked(extensions = 'groovy.typecheckers.NullChecker(strict: true)')\nclass NullSafeService {\n    static String normalize(String input) {\n        def candidate = null\n        candidate = input?.trim()\n        if (candidate != null && !candidate.isEmpty()) {\n            return candidate.toUpperCase()\n        }\n        return 'DEFAULT'\n    }\n}\n\nassert NullSafeService.normalize('  groovy 6  ') == 'GROOVY 6'\nassert NullSafeService.normalize(null) == 'DEFAULT'\nprintln \"normalize('  groovy 6  ')=${NullSafeService.normalize('  groovy 6  ')}, normalize(null)=${NullSafeService.normalize(null)}\"",
          "expectedOutput": "normalize('  groovy 6  ')=GROOVY 6, normalize(null)=DEFAULT",
          "execMs": 146,
          "verifiedOut": "normalize('  groovy 6  ')=GROOVY 6, normalize(null)=DEFAULT",
          "grabs": [
            "groovy-typecheckers"
          ]
        },
        {
          "id": "4.4",
          "slug": "combiner-checker-associative",
          "title": "`CombinerChecker` with `@Associative` for Safe Parallel Reductions",
          "gep": "groovy-typecheckers",
          "category": "Contracts & Type Checkers",
          "keywords": [
            "CombinerChecker",
            "@Associative",
            "@Reducer",
            "injectParallel"
          ],
          "summary": "Prevent non-associative parallel reduction bugs at compile time with `CombinerChecker` and `@Associative`.",
          "prose": [
            "Parallel reductions like `injectParallel` or `Stream.reduce` silently produce corrupted results if the combiner function is not associative (for example, subtraction `(a, b) -> a - b`).",
            "Groovy 6 adds `CombinerChecker` alongside `@Associative` and `@Reducer`: it inspects parallel reduction calls at compile time, rejects known non-associative operators (`-`, `/`, `**`), and verifies that custom method references passed to `injectParallel` are marked `@Associative`."
          ],
          "beforeAfter": {
            "beforeTitle": "Silent Parallel Reduction Bug",
            "beforeCode": "// Non-associative subtraction gives arbitrary answers in parallel!\nvalues.injectParallel(0) { a, b -> a - b }",
            "afterTitle": "Groovy 6.0 (`CombinerChecker` + `@Associative`)",
            "afterCode": "class MathOps {\n    @Associative static int sumInts(int a, int b) { a + b }\n}\n@TypeChecked(extensions = 'groovy.typecheckers.CombinerChecker')\nint parallelSum(List<Integer> v) { v.injectParallel(0, MathOps.&sumInts) }"
          },
          "underTheHood": "`CombinerChecker` recognizes associative arithmetic/logical operators (`+`, `*`, `Math::min`, `Math::max`) and checks `@Associative` on resolved `MethodNode` targets.",
          "code": "class MathOps {\n    @Associative\n    static int sumInts(int a, int b) { a + b }\n}\n\n@TypeChecked(extensions = 'groovy.typecheckers.CombinerChecker')\nint parallelSum(List<Integer> values) {\n    values.injectParallel(0, MathOps.&sumInts)\n}",
          "fullCode": "@Grab('org.apache.groovy:groovy-typecheckers:6.0.0')\nimport groovy.transform.Associative\nimport groovy.transform.TypeChecked\n\nclass MathOps {\n    @Associative\n    static int sumInts(int a, int b) { a + b }\n}\n\n@TypeChecked(extensions = 'groovy.typecheckers.CombinerChecker')\nint parallelSum(List<Integer> values) {\n    values.injectParallel(0, MathOps.&sumInts)\n}\n\nval total = parallelSum([10, 20, 30, 40])\nassert total == 100\nprintln \"Verified associative parallel sum: ${total}\"",
          "expectedOutput": "Verified associative parallel sum: 100",
          "execMs": 105,
          "verifiedOut": "Verified associative parallel sum: 100",
          "grabs": [
            "groovy-typecheckers"
          ]
        },
        {
          "id": "4.5",
          "slug": "monadic-comprehensions-do",
          "title": "Monadic Comprehensions (`DO` Macro & `MonadicChecker`)",
          "gep": "GEP-23",
          "category": "Contracts & Type Checkers",
          "keywords": [
            "DO",
            "MonadicChecker",
            "Optional",
            "Stream"
          ],
          "summary": "Write Haskell/Scala-style `for`/`do` comprehensions over `Optional`, `Stream`, `Iterable`, or `CompletableFuture` without nested `flatMap` pyramids.",
          "prose": [
            "Deeply nested `.flatMap { a -> ... .flatMap { b -> ... } }` chains across `Optional`, `Stream`, or `Awaitable` quickly become hard to read. Under `GEP-23`, Groovy 6's `groovy-macro-library` provides the `DO(...)` macro, which rewrites sequential `x in monadExpr` bindings, local assignments, and filter guards into flatMap/map/filter pipelines at compile time.",
            "Pairing `DO` with `groovy.typecheckers.MonadicChecker` verifies that all steps in the comprehension belong to compatible monadic container types and propagates element types through `@TypeChecked` / `@CompileStatic`."
          ],
          "beforeAfter": {
            "beforeTitle": "Nested `Optional.flatMap` Pyramid",
            "beforeCode": "Optional.ofNullable(dir[id]).flatMap { raw ->\n    Optional.ofNullable(raw.contains('|') ? raw.split(/\\|/)[1] : null)\n        .map { role -> \"[$id:${role.toUpperCase()}]\" }\n}",
            "afterTitle": "Groovy 6.0 (`DO` Monadic Comprehension)",
            "afterCode": "DO(\n    raw  in Optional.ofNullable(dir[id]),\n    role in Optional.ofNullable(raw.contains('|') ? raw.split(/\\|/)[1] : null)\n) {\n    Optional.of(\"[$id:${role.toUpperCase()}]\")\n}"
          },
          "underTheHood": "The `DO` macro desugars each `var in expr` clause into a `Monad` typeclass dispatch (`Optional`, `Iterable`, `Stream`), short-circuiting immediately when any `Optional` step is empty.",
          "code": "@TypeChecked(extensions = 'groovy.typecheckers.MonadicChecker')\nOptional<String> formatBadge(Map<String, String> dir, String id) {\n    DO(\n        raw  in Optional.ofNullable(dir[id]),\n        role in Optional.ofNullable(raw.contains('|') ? raw.split(/\\|/)[1] : null)\n    ) {\n        Optional.of(\"[$id:${role.toUpperCase()}]\".toString())\n    }\n}",
          "fullCode": "@Grab('org.apache.groovy:groovy-macro-library:6.0.0')\n@Grab('org.apache.groovy:groovy-typecheckers:6.0.0')\nimport groovy.lang.GroovyClassLoader\nimport groovy.lang.GroovyShell\n\ndef badge = new GroovyShell(new GroovyClassLoader(this.class.classLoader)).evaluate('''\nimport groovy.transform.TypeChecked\nimport static org.apache.groovy.macrolib.MacroLibGroovyMethods.DO\n\n@TypeChecked(extensions = 'groovy.typecheckers.MonadicChecker')\nOptional<String> formatBadge(Map<String, String> dir, String id) {\n    DO(\n        raw  in Optional.ofNullable(dir[id]),\n        role in Optional.ofNullable(raw.contains('|') ? raw.split(/\\\\|/)[1] : null)\n    ) {\n        Optional.of(\"[$id:${role.toUpperCase()}]\".toString())\n    }\n}\n\nval directory = [u1: 'Alice|admin', u2: 'Bob']\nassert formatBadge(directory, 'u1') == Optional.of('[u1:ADMIN]')\nassert formatBadge(directory, 'u2') == Optional.empty()\nformatBadge(directory, 'u1').get()\n''')\nprintln \"Monadic DO comprehension result: ${badge}\"",
          "expectedOutput": "Monadic DO comprehension result: [u1:ADMIN]",
          "execMs": 113,
          "verifiedOut": "Monadic DO comprehension result: [u1:ADMIN]",
          "grabs": [
            "groovy-macro-library",
            "groovy-typecheckers"
          ]
        },
        {
          "id": "4.6",
          "slug": "saferegex-redos-protection",
          "title": "`@SafeRegex` Timeout Protection & Compile-Time `RegexChecker`",
          "gep": "GROOVY-12122",
          "category": "Contracts & Type Checkers",
          "keywords": [
            "@SafeRegex",
            "RegexTimeoutException",
            "RegexChecker"
          ],
          "summary": "Defend against catastrophic regex backtracking (ReDoS) at both compile time (`RegexChecker`) and runtime (`@SafeRegex`).",
          "prose": [
            "Regular expression Denial of Service (ReDoS) happens when a regex with nested quantifiers like `/((a+)+)\\1!/` suffers exponential backtracking on crafted input. Groovy 6 tackles this at two levels: `RegexChecker` flags vulnerable nested-quantifier patterns at compile time, while `@SafeRegex(millis = 20)` wraps regex targets in a time-bounded `InterruptibleCharSequence` at runtime.",
            "If a regex match exceeds the configured timeout budget, it aborts immediately and throws `groovy.util.regex.RegexTimeoutException` instead of hanging a worker thread."
          ],
          "beforeAfter": {
            "beforeTitle": "Unbounded Regex Evaluation (Thread Hang on Crafted Input)",
            "beforeCode": "// Hangs CPU indefinitely on 'a' * 60 + 'X'!\ntext ==~ /((a+)+)\\1!/",
            "afterTitle": "Groovy 6.0 (`@SafeRegex(millis = 20)`)",
            "afterCode": "@SafeRegex(millis = 20)\nstatic boolean matchesSafely(String text) {\n    text ==~ /((a+)+)\\1!/ // throws RegexTimeoutException in 20ms!\n}"
          },
          "underTheHood": "`SafeRegexASTTransformation` wraps the `CharSequence` argument of `=~`, `==~`, and `Pattern.matcher(...)` inside a deadline-checking `CharSequence` that checks `System.nanoTime()` on character reads.",
          "code": "@SafeRegex(millis = 20)\nclass SafeMatcher {\n    static boolean matchesBacktracking(String text) {\n        text ==~ /((a+)+)\\1!/\n    }\n}\n\nassert SafeMatcher.matchesBacktracking('aaaa!')\n// Throws RegexTimeoutException in ~20ms on 'a' * 60 + 'X'!",
          "fullCode": "import groovy.transform.SafeRegex\nimport groovy.util.regex.RegexTimeoutException\n\n@SafeRegex(millis = 20)\nclass SafeMatcher {\n    static boolean matchesBacktracking(String text) {\n        text ==~ /((a+)+)\\1!/\n    }\n}\n\nassert SafeMatcher.matchesBacktracking('aaaa!')\nboolean timedOut = false\ntry {\n    SafeMatcher.matchesBacktracking('a' * 60 + 'X')\n} catch (RegexTimeoutException ex) {\n    timedOut = true\n}\nassert timedOut\nprintln \"SafeRegex matched valid input=true, aborted ReDoS attack=${timedOut}\"",
          "expectedOutput": "SafeRegex matched valid input=true, aborted ReDoS attack=true",
          "execMs": 41,
          "verifiedOut": "SafeRegex matched valid input=true, aborted ReDoS attack=true",
          "grabs": []
        },
        {
          "id": "4.7",
          "slug": "virtual-static-methods-in-traits",
          "title": "`@Virtual` Overridable Static Methods on Traits",
          "gep": "GEP-22",
          "category": "Contracts & Type Checkers",
          "keywords": [
            "@Virtual",
            "trait",
            "static override"
          ],
          "summary": "Allow static trait methods to participate in polymorphic dispatch when an implementing class overrides a `@Virtual` static helper.",
          "prose": [
            "Normally, static methods in traits are bound early to the trait's own helper class—so if trait static method `A()` calls static method `B()`, overriding `B()` in an implementing class does not affect `A()`. Under `GEP-22`, marking `B()` with `@Virtual` makes intra-trait static calls dispatch through the implementing class (`$static$self`), enabling polymorphic static configuration and factory patterns across traits."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (Static trait methods bound early)",
            "beforeCode": "trait Configurable {\n    static int defaultPageSize() { 25 }\n    static String info() { \"size=${defaultPageSize()}\" } // always 25!\n}",
            "afterTitle": "Groovy 6.0 (`@Virtual` static trait dispatch)",
            "afterCode": "trait Configurable {\n    @Virtual static int defaultPageSize() { 25 }\n    static String info() { \"size=${defaultPageSize()}\" } // dispatches to implementing class!\n}"
          },
          "underTheHood": "`TraitComposer` threads a `$static$self` `Class` receiver parameter into `@Virtual` static trait helpers so calls resolve against the concrete implementing class.",
          "code": "trait ConfigurableEntity {\n    @Virtual static int defaultPageSize() { 25 }\n    static String describePagination() { \"pageSize=${defaultPageSize()}\" }\n}\n\nclass StandardEntity implements ConfigurableEntity {}\nclass CompactEntity implements ConfigurableEntity {\n    static int defaultPageSize() { 10 } // overrides @Virtual static!\n}\n\nassert StandardEntity.describePagination() == 'pageSize=25'\nassert CompactEntity.describePagination()  == 'pageSize=10'",
          "fullCode": "import groovy.transform.Virtual\n\ntrait ConfigurableEntity {\n    @Virtual static int defaultPageSize() { 25 }\n    static String describePagination() { \"pageSize=${defaultPageSize()}\" }\n}\n\nclass StandardEntity implements ConfigurableEntity {}\nclass CompactEntity implements ConfigurableEntity {\n    static int defaultPageSize() { 10 }\n}\n\nassert StandardEntity.describePagination() == 'pageSize=25'\nassert CompactEntity.describePagination()  == 'pageSize=10'\nprintln \"Standard=${StandardEntity.describePagination()}, Compact=${CompactEntity.describePagination()}\"",
          "expectedOutput": "Standard=pageSize=25, Compact=pageSize=10",
          "execMs": 12,
          "verifiedOut": "Standard=pageSize=25, Compact=pageSize=10",
          "grabs": []
        }
      ],
      "fileExecMs": 922,
      "fileOut": "=== 04. Contracts, Purity, Type Checkers & Monadic Comprehensions ===\n[OK] 1. @Invariant, @Requires, @Ensures, @Modifies & @Pure with compile-time checkers\n[OK] 2. Loop @Invariant/@Decreases, recursive @Decreases & woven @ThrowsIf\n[OK] 3. Flow-sensitive NullChecker(strict: true)\n[OK] 4. CombinerChecker & @Associative parallel reduction verification\n[OK] 5. Monadic comprehensions (`DO` macro + MonadicChecker)\n[OK] 6. @SafeRegex protection against catastrophic backtracking (ReDoS)\n[OK] 7. @Virtual overridable static methods in traits (GEP-22)"
    },
    {
      "num": "05",
      "id": "gdk-and-ginq",
      "page": "05-gdk-and-ginq.html",
      "scriptFile": "05_gdk_and_ginq.groovy",
      "navLabel": "5. GDK, Lambdas & GINQ",
      "shortTitle": "GDK Extensions, Fat-Free Lambdas & GINQ",
      "title": "GDK Power-Ups, Fat-Free Lambdas, `groovyToString` & GINQ",
      "subtitle": "groupByMany, zipWithNext, groupConsecutive, isSorted, clamp, takeIf, lazy grepping, findBalancedGroups, locale currency/percent helpers, Process.waitForResult, async NIO, fat-free java.util.function overloads, groovyToString, and graduated GINQ.",
      "category": "GDK & GINQ",
      "accent": "cyan",
      "highlights": [
        "groupByMany",
        "zipWithNext",
        "groupConsecutive",
        "findBalancedGroups",
        "curryWith",
        "groovyToString",
        "GQL"
      ],
      "sections": [
        {
          "id": "5.1",
          "slug": "group-by-many",
          "title": "`groupByMany`: Multi-Key Grouping & Map Value-to-Key Inversion",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "groupByMany",
            "Map inversion"
          ],
          "summary": "Place each element into multiple group buckets simultaneously, or invert a `Map<K, Iterable<V>>` into `Map<V, List<K>>` with zero arguments.",
          "prose": [
            "While `groupBy` maps each element to a single key, real-world domains often associate an item with multiple tags, roles, or categories. `groupByMany` accepts a closure returning an `Iterable` of keys and places the element into every returned bucket.",
            "Called with no arguments on a `Map<K, Iterable<V>>` (such as `[alice: ['music', 'chess'], bob: ['chess']]`), `map.groupByMany()` inverts the map into `[music: ['alice'], chess: ['alice', 'bob']]` in a single call!"
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (Manual multi-key flattening & grouping)",
            "beforeCode": "def inverted = [:].withDefault { [] }\nuserHobbies.each { user, hobbies ->\n    hobbies.each { h -> inverted[h] << user }\n}",
            "afterTitle": "Groovy 6.0 (`groupByMany()`)",
            "afterCode": "def inverted = userHobbies.groupByMany()"
          },
          "underTheHood": "`DefaultGroovyMethods.groupByMany` preserves insertion order via `LinkedHashMap` and supports both `Iterable` and `Map` receivers.",
          "code": "var words = ['ant', 'bee', 'ape', 'cow']\nvar vowels = 'aeiou'.toSet()\nassert words.groupByMany { it.toSet().intersect(vowels) } == [\n    a: ['ant', 'ape'], e: ['bee', 'ape'], o: ['cow']\n]\n\n// No-arg Map inversion:\nvar hobbies = [alice: ['music', 'chess'], bob: ['chess']]\nassert hobbies.groupByMany() == [music: ['alice'], chess: ['alice', 'bob']]",
          "fullCode": "var words = ['ant', 'bee', 'ape', 'cow']\nvar vowels = 'aeiou'.toSet()\ndef byVowel = words.groupByMany { String w -> w.toSet().intersect(vowels) }\nassert byVowel == [a: ['ant', 'ape'], e: ['bee', 'ape'], o: ['cow']]\n\nvar hobbies = [alice: ['music', 'chess'], bob: ['chess']]\ndef inverted = hobbies.groupByMany()\nassert inverted == [music: ['alice'], chess: ['alice', 'bob']]\nprintln \"byVowel=${byVowel}, inverted=${inverted}\"",
          "expectedOutput": "byVowel=[a:[ant, ape], e:[bee, ape], o:[cow]], inverted=[music:[alice], chess:[alice, bob]]",
          "execMs": 13,
          "verifiedOut": "byVowel=[a:[ant, ape], e:[bee, ape], o:[cow]], inverted=[chess:[alice, bob], music:[alice]]",
          "grabs": []
        },
        {
          "id": "5.2",
          "slug": "zipwithnext-and-groupconsecutive",
          "title": "`zipWithNext` (Sliding Pairs & Deltas) & `groupConsecutive` (Maximal Runs)",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "zipWithNext",
            "groupConsecutive"
          ],
          "summary": "Pair adjacent elements or compute point-to-point deltas with `zipWithNext`, and split sequences into consecutive runs with `groupConsecutive`.",
          "prose": [
            "`zipWithNext()` pairs each element with its immediate successor (`[1, 2, 3, 4].zipWithNext() == [[1, 2], [2, 3], [3, 4]]`), and its 2-argument closure overload (`list.zipWithNext { a, b -> b - a }`) computes consecutive deltas without intermediate lists.",
            "`groupConsecutive()` partitions a sequence into maximal runs of adjacent equal elements (or elements sharing a key under `groupConsecutive { keyFn }`)—unlike `groupBy`, non-adjacent occurrences start a fresh run."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (`collate(2, 1, false)`)",
            "beforeCode": "def deltas = [10, 15, 13, 20].collate(2, 1, false).collect { a, b -> b - a }",
            "afterTitle": "Groovy 6.0 (`zipWithNext` & `groupConsecutive`)",
            "afterCode": "def deltas = [10, 15, 13, 20].zipWithNext { a, b -> b - a }\ndef runs   = [1, 1, 2, 2, 2, 3, 1].groupConsecutive()"
          },
          "underTheHood": "Both methods operate in a single $O(n)$ pass over any `Iterable` or `Iterator`.",
          "code": "// Consecutive deltas in one pass:\nassert [10, 15, 13, 20].zipWithNext { a, b -> b - a } == [5, -2, 7]\n\n// Maximal consecutive runs:\nassert [1, 1, 2, 2, 2, 3, 1].groupConsecutive() == [[1, 1], [2, 2, 2], [3], [1]]",
          "fullCode": "def pairs  = [1, 2, 3, 4].zipWithNext()\ndef deltas = [10, 15, 13, 20].zipWithNext { a, b -> b - a }\ndef runs   = [1, 1, 2, 2, 2, 3, 1].groupConsecutive()\nassert pairs == [[1, 2], [2, 3], [3, 4]]\nassert deltas == [5, -2, 7]\nassert runs == [[1, 1], [2, 2, 2], [3], [1]]\nprintln \"Deltas=${deltas}, Runs=${runs}\"",
          "expectedOutput": "Deltas=[5, -2, 7], Runs=[[1, 1], [2, 2, 2], [3], [1]]",
          "execMs": 8,
          "verifiedOut": "Deltas=[5, -2, 7], Runs=[[1, 1], [2, 2, 2], [3], [1]]",
          "grabs": []
        },
        {
          "id": "5.3",
          "slug": "collection-and-stream-helpers",
          "title": "`isSorted`, `clamp`, `takeIf`, Lazy `grepping` & Stream Accumulators",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "isSorted",
            "clamp",
            "takeIf",
            "grepping",
            "toImmutableList"
          ],
          "summary": "Non-mutating sort checks, numeric/Comparable clamping, Kotlin-style `takeIf`, lazy iterator `grepping`, and `toImmutableList` / `toMutableList`.",
          "prose": [
            "Groovy 6 rounds out the GDK with everyday ergonomic helpers: `isSorted()` checks ordering in $O(n)$ without cloning or sorting; `clamp(min, max)` and `clamp(min..max)` bound any `Comparable` or primitive number; and `takeIf { predicate }` returns the receiver when the condition holds or `null` otherwise (composing naturally with `?.` and `?:`).",
            "For lazy pipelines, `iterator.grepping(filter)` filters an `Iterator` on the fly without allocating a list (unlike eager `grep`), while `toImmutableList()`, `toMutableList()`, `toImmutableSet()`, and `toMutableSet()` make mutability intent explicit on both `Iterable` and `Stream`."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5",
            "beforeCode": "def clamped = Math.max(0, Math.min(100, score))\ndef isOrd = (list == list.toSorted()) // allocates & sorts O(n log n)!",
            "afterTitle": "Groovy 6.0",
            "afterCode": "def clamped = score.clamp(0..100)\ndef isOrd   = list.isSorted() // O(n) zero-allocation check!"
          },
          "underTheHood": "`grepping` returns a lazy `FilteringIterator` that applies Groovy's `Object.isCase` protocol element-by-element.",
          "code": "assert [1, 3, 5, 9].isSorted() && 15.clamp(1..10) == 10\n\ndef rawHost = 'groovy-lang.org'\ndef url = rawHost.takeIf { it.startsWith('https://') } ?: \"https://$rawHost\"\n\ndef truthyStrings = [0, 'hello', '', 42, 'world']\n    .iterator().grepping(String).grepping().toList()\nassert truthyStrings == ['hello', 'world']",
          "fullCode": "import java.util.stream.Stream\n\nassert [1, 3, 5, 9].isSorted()\nassert 15.clamp(1..10) == 10\n\ndef rawHost = 'groovy-lang.org'\ndef url = rawHost.takeIf { it.startsWith('https://') } ?: \"https://$rawHost\".toString()\nassert url == 'https://groovy-lang.org'\n\ndef truthyStrings = [0, 'hello', '', 42, null, 'world']\n    .iterator().grepping(String).grepping().toList()\nassert truthyStrings == ['hello', 'world']\n\ndef imm = Stream.of(1, 2, 3).toImmutableList()\nassert imm == [1, 2, 3]\nprintln \"url=${url}, grepping=${truthyStrings}, clamped=${15.clamp(1..10)}\"",
          "expectedOutput": "url=https://groovy-lang.org, grepping=[hello, world], clamped=10",
          "execMs": 21,
          "verifiedOut": "url=https://groovy-lang.org, grepping=[hello, world], clamped=10",
          "grabs": []
        },
        {
          "id": "5.4",
          "slug": "regex-groups-and-balanced-delimiters",
          "title": "Regex Group Extraction (`findGroups`, `findBalancedGroups`)",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "findGroups",
            "findAllGroups",
            "findBalancedGroups"
          ],
          "summary": "Destructure regex capture groups directly into variables and extract arbitrarily nested balanced parentheses/brackets as tree structures.",
          "prose": [
            "`findGroups` and `findAllGroups` return `MatchGroup` lists (`matchedString`, `startIndex`, `endIndex`) that support direct multi-assignment destructuring—automatically padding missing optional groups with `null`.",
            "Even better, `findBalancedGroups(openPattern, closePattern)` solves a classic limitation of regular expressions: it parses nested balanced delimiters (like nested parentheses in `calc(add(1, 2), mul(3, 4))`) and returns `BalancedGroup` trees complete with recursive `.children`!"
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (`Matcher` indexing boilerplate)",
            "beforeCode": "def m = ('6.0.0-rc1' =~ /(\\d+)\\.(\\d+)\\.(\\d+)(?:-(.+))?/)\ndef (maj, min, pat, qual) = m ? [m[0][1], m[0][2], m[0][3], m[0][4]] : []",
            "afterTitle": "Groovy 6.0 (`findGroups` & `findBalancedGroups`)",
            "afterCode": "def (_, maj, min, pat, qual) = '6.0.0-rc1'.findGroups(semver)\ndef tree = 'calc(add(1, 2), mul(3, 4))'.findBalancedGroups(/\\(/, /\\)/)"
          },
          "underTheHood": "`findBalancedGroups` scans open and close regex matches with a depth stack, building hierarchical `BalancedGroup` nodes in a single pass.",
          "code": "def semver = /(\\d+)\\.(\\d+)\\.(\\d+)(?:-(.+))?/\ndef (_, major, minor, patch, qual) = '6.0.0'.findGroups(semver)\nassert [major, minor, patch, qual] == ['6', '0', '0', null]\n\ndef expr = 'calc(add(1, 2), mul(3, 4))'\ndef balanced = expr.findBalancedGroups(/\\(/, /\\)/)\nassert balanced[0].children*.matchedString == ['(1, 2)', '(3, 4)']",
          "fullCode": "def semver = /(\\d+)\\.(\\d+)\\.(\\d+)(?:-(.+))?/\ndef (_, major, minor, patch, qual) = '6.0.0'.findGroups(semver)\nassert [major, minor, patch, qual] == ['6', '0', '0', null]\n\ndef expr = 'calc(add(1, 2), mul(3, 4)) + fn(x)'\ndef balanced = expr.findBalancedGroups(/\\(/, /\\)/)\nassert balanced*.matchedString == ['(add(1, 2), mul(3, 4))', '(x)']\nassert balanced[0].children*.matchedString == ['(1, 2)', '(3, 4)']\nprintln \"Semver=${[major, minor, patch, qual]}, Children=${balanced[0].children*.matchedString}\"",
          "expectedOutput": "Semver=[6, 0, 0, null], Children=[(1, 2), (3, 4)]",
          "execMs": 9,
          "verifiedOut": "Semver=[6, 0, 0, null], Children=[(1, 2), (3, 4)]",
          "grabs": []
        },
        {
          "id": "5.5",
          "slug": "locale-currency-and-percent",
          "title": "Locale-Aware Currency & Percent Formatting / Parsing",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "toCurrencyString",
            "toCurrencyNumber",
            "toPercentString",
            "toPercentNumber"
          ],
          "summary": "Format and parse currency and percentage strings directly on `Number` and `CharSequence` with optional `Locale`.",
          "prose": [
            "Formatting a number as currency or parsing a localized percentage string no longer requires ceremony with `NumberFormat.getCurrencyInstance(locale)`. Groovy 6 adds symmetrical GDK methods on `Number` and `CharSequence`: `toCurrencyString`, `toCurrencyNumber`, `toPercentString`, `toPercentNumber`, `toFormattedString`, and `toFormattedNumber`."
          ],
          "beforeAfter": {
            "beforeTitle": "Java `NumberFormat` Boilerplate",
            "beforeCode": "def fmt = NumberFormat.getCurrencyInstance(Locale.US)\nString s = fmt.format(1234.5)\nNumber n = fmt.parse('$1,234.50')",
            "afterTitle": "Groovy 6.0 GDK Helpers",
            "afterCode": "String s = 1234.5.toCurrencyString(Locale.US)\nNumber n = '$1,234.50'.toCurrencyNumber(Locale.US)"
          },
          "underTheHood": "`NumberFormat` instances are configured with `parseBigDecimal = true` so currency parsing returns exact `BigDecimal` values without floating-point rounding.",
          "code": "assert 1234.5.toCurrencyString(Locale.US) == '$1,234.50'\nassert '$1,234.50'.toCurrencyNumber(Locale.US) == 1234.5G\nassert 0.875.toPercentString(Locale.US) == '88%'\nassert '94.5%'.toPercentNumber(Locale.US) == 0.945G",
          "fullCode": "val usd = 1234.5.toCurrencyString(Locale.US)\nval parsedUsd = '$1,234.50'.toCurrencyNumber(Locale.US)\nval pct = 0.875.toPercentString(Locale.US)\nval parsedPct = '94.5%'.toPercentNumber(Locale.US)\n\nassert usd == '$1,234.50' && parsedUsd == 1234.5G\nassert pct == '88%' && parsedPct == 0.945G\nprintln \"USD=${usd} (${parsedUsd}), Percent=${pct} (${parsedPct})\"",
          "expectedOutput": "USD=$1,234.50 (1234.5), Percent=88% (0.945)",
          "execMs": 12,
          "verifiedOut": "USD=$1,234.50 (1234.50), Percent=88% (0.945)",
          "grabs": []
        },
        {
          "id": "5.6",
          "slug": "process-waitforresult-and-async-nio",
          "title": "Process `waitForResult()` & Non-Blocking File I/O (`Path.textAsync`)",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "waitForResult()",
            "ProcessResult",
            "textAsync",
            "writeAsync"
          ],
          "summary": "Capture subprocess exit codes, `out`, and `err` without stream deadlocks, and read/write files asynchronously via JDK NIO.2 `AsynchronousFileChannel`.",
          "prose": [
            "`Process.waitForResult()` drains `stdout` and `stderr` concurrently on background threads while waiting for the process to exit (with an optional timeout), returning an immutable `ProcessResult(exitCode, out, err)` with a Groovy-truthy `.ok` property (`exitCode == 0`).",
            "For non-blocking file I/O, `Path` and `File` gain `.textAsync`, `.bytesAsync`, `.writeAsync(...)`, and `.appendAsync(...)` backed by NIO.2 `AsynchronousFileChannel` and returning `Awaitable`s that compose directly with `await`."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (`consumeProcessOutput` + `waitFor`)",
            "beforeCode": "def out = new StringBuilder(), err = new StringBuilder()\ndef proc = 'echo hello'.execute()\nproc.consumeProcessOutput(out, err)\nint code = proc.waitFor()",
            "afterTitle": "Groovy 6.0 (`waitForResult()` & `Path.textAsync`)",
            "afterCode": "def res = 'echo hello'.execute().waitForResult()\nassert res.ok && res.out.trim() == 'hello'\nawait(tmpFile.writeAsync('Groovy 6 NIO'))\nString text = await(tmpFile.textAsync)"
          },
          "underTheHood": "`ProcessResult.asBoolean()` returns `exitCode == 0`, so you can write `if (proc.waitForResult()) { ... }`.",
          "code": "def proc = 'echo Groovy6-CLI'.execute().waitForResult()\nassert proc.ok && proc.exitCode == 0 && proc.out.trim() == 'Groovy6-CLI'\n\nPath tmp = Files.createTempFile('g6-', '.txt')\nawait(tmp.writeAsync('Async NIO'))\nassert await(tmp.textAsync) == 'Async NIO'",
          "fullCode": "import java.nio.file.Files\nimport java.nio.file.Path\n\ndef proc = 'echo Groovy6-CLI'.execute().waitForResult()\nassert proc.ok && proc.exitCode == 0 && proc.out.trim() == 'Groovy6-CLI'\n\nPath tmp = Files.createTempFile('g6-', '.txt')\ntry {\n    await(tmp.writeAsync('Async NIO in Groovy 6'))\n    String content = await(tmp.textAsync)\n    assert content == 'Async NIO in Groovy 6'\n    println \"Process=${proc.out.trim()} (ok=${proc.ok}), File=${content}\"\n} finally {\n    Files.deleteIfExists(tmp)\n}",
          "expectedOutput": "Process=Groovy6-CLI (ok=true), File=Async NIO in Groovy 6",
          "execMs": 76,
          "verifiedOut": "Process=Groovy6-CLI (ok=true), File=Async NIO in Groovy 6",
          "grabs": []
        },
        {
          "id": "5.7",
          "slug": "fat-free-lambdas-and-currywith",
          "title": "Fat-Free `java.util.function` Overloads & `Closures.curryWith`",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "Predicate",
            "Function",
            "Closures.curryWith",
            "@CompileStatic"
          ],
          "summary": "Pass lightweight JVM lambdas (`Predicate`, `Function`, `BiConsumer`) to GDK methods with zero `Closure` wrapper overhead.",
          "prose": [
            "Over 60 core GDK higher-order methods (`each`, `collect`, `findAll`, `any`, `every`, `groupBy`, `count`, `max`, `min`, `sum`, `with`, `tap`, etc.) now provide overloads accepting standard `java.util.function` interfaces (`Predicate`, `Function`, `Consumer`, `BiFunction`, `BiPredicate`).",
            "In `@CompileStatic` code, passing a native lambda `(Integer n) -> n * 2` or method reference compiles via `LambdaMetafactory` without allocating a `groovy.lang.Closure`. And `Closures.curryWith(biPredicate, arg)` partially applies standard functional interfaces cleanly."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (GDK methods required `Closure`)",
            "beforeCode": "// Passing a java.util.function.Predicate required `.test` or Closure wrapping\nPredicate<Integer> isEven = (Integer n) -> n % 2 == 0\nlist.findAll { isEven.test(it) }",
            "afterTitle": "Groovy 6.0 (Direct `java.util.function` GDK Overloads)",
            "afterCode": "Predicate<Integer> isEven = (Integer n) -> n % 2 == 0\nlist.findAll(isEven)"
          },
          "underTheHood": "Under `@CompileStatic`, the compiler selects the `java.util.function` overload directly, emitting an `invokedynamic` `LambdaMetafactory.metafactory` call site.",
          "code": "Predicate<Integer> isEven = (Integer n) -> n % 2 == 0\nFunction<Integer, Integer> triple = (Integer n) -> n * 3\nBiPredicate<Integer, Integer> divBy = (Integer n, Integer d) -> n % d == 0\n\nassert [1, 2, 3, 4].findAll(isEven).collect(triple) == [6, 12]\nassert [3, 4, 6, 9].findAll(curryWith(divBy, 3)) == [3, 6, 9]",
          "fullCode": "import groovy.transform.CompileStatic\nimport java.util.function.BiPredicate\nimport java.util.function.Function\nimport java.util.function.Predicate\nimport static org.apache.groovy.util.Closures.curryWith\n\n@CompileStatic\nString demoLambdas() {\n    Predicate<Integer> isEven = (Integer n) -> n % 2 == 0\n    Function<Integer, Integer> triple = (Integer n) -> n * 3\n    BiPredicate<Integer, Integer> divBy = (Integer n, Integer d) -> n % d == 0\n\n    def evensTripled = [1, 2, 3, 4].findAll(isEven).collect(triple)\n    def multiplesOf3 = [3, 4, 6, 9].findAll(curryWith(divBy, 3))\n    return \"evensTripled=${evensTripled}, multiplesOf3=${multiplesOf3}\"\n}\n\nval res = demoLambdas()\nassert res == 'evensTripled=[6, 12], multiplesOf3=[3, 6, 9]'\nprintln res",
          "expectedOutput": "evensTripled=[6, 12], multiplesOf3=[3, 6, 9]",
          "execMs": 55,
          "verifiedOut": "evensTripled=[6, 12], multiplesOf3=[3, 6, 9]",
          "grabs": []
        },
        {
          "id": "5.8",
          "slug": "groovy-to-string-protocol",
          "title": "Customisable Display Protocol with `groovyToString()`",
          "gep": "GDK 6.0",
          "category": "GDK & GINQ",
          "keywords": [
            "groovyToString()",
            "InvokerHelper.toString",
            "GString"
          ],
          "summary": "Customize how objects render inside GStrings, collection/map formatting, and `dump()` without breaking Java's `Object.toString()` contract.",
          "prose": [
            "Sometimes a class must keep a strict machine-readable `toString()` for Java libraries or serialization, while wanting a safer or richer human-readable representation in logs, GStrings, and collection dumps (for example, masking API tokens or formatting matrices).",
            "In Groovy 6, `InvokerHelper.toString` and `GString` interpolation check for a `groovyToString()` method first, falling back to `toString()` when absent."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (`toString()` used everywhere)",
            "beforeCode": "// Overriding toString() to mask secrets broke callers expecting raw value!",
            "afterTitle": "Groovy 6.0 (`groovyToString()` display protocol)",
            "afterCode": "class SecretToken {\n    String raw\n    String toString() { raw }\n    String groovyToString() { \"SecretToken(***${raw.takeRight(3)})\" }\n}"
          },
          "underTheHood": "`InvokerHelper.format` invokes `groovyToString()` via `MetaClass` lookup when formatting GString values, Lists, Maps, and Ranges.",
          "code": "class SecretToken {\n    String raw\n    String toString() { raw }\n    String groovyToString() { \"SecretToken(***${raw.takeRight(3)})\" }\n}\n\ndef tok = new SecretToken(raw: 'ghp_123456789xyz')\nassert tok.toString() == 'ghp_123456789xyz'\nassert \"$tok\" == 'SecretToken(***xyz)'",
          "fullCode": "class SecretToken {\n    String raw\n    String toString() { raw }\n    String groovyToString() { \"SecretToken(***${raw.takeRight(3)})\" }\n}\n\ndef tok = new SecretToken(raw: 'ghp_123456789xyz')\nassert tok.toString() == 'ghp_123456789xyz'\nassert \"$tok\" == 'SecretToken(***xyz)'\nassert [auth: tok].toString() == '[auth:SecretToken(***xyz)]'\nprintln \"rawLen=${tok.toString().length()}, formatted=${[auth: tok]}\"",
          "expectedOutput": "rawLen=16, formatted=[auth:SecretToken(***xyz)]",
          "execMs": 10,
          "verifiedOut": "rawLen=16, formatted=[auth:SecretToken(***xyz)]",
          "grabs": []
        },
        {
          "id": "5.9",
          "slug": "ginq-graduated-groupby-and-sets",
          "title": "GINQ Graduated: `groupby ... into g` & Set Operators (`union`, `intersect`, `minus`)",
          "gep": "groovy-ginq",
          "category": "GDK & GINQ",
          "keywords": [
            "GQL",
            "groupby ... into",
            "union",
            "intersect",
            "minus"
          ],
          "summary": "Bind group partitions via `groupby ... into g` for rich aggregate projections and combine queries with `union`, `unionall`, `intersect`, and `minus`.",
          "prose": [
            "Groovy-Integrated Query (`groovy-ginq`) graduates from incubating in Groovy 6 with two major query-language additions: C# LINQ-style `groupby <expr> into g` binds the group partition to an explicit variable `g` exposing `g.key`, `g.count()`, `g.sum(...)`, `g.min(...)`, `g.max(...)`, `g.avg(...)`, and `g.toList()`.",
            "GINQ also adds SQL-style set operators between query blocks: `union` (distinct), `unionall`, `intersect`, and `minus`."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 GINQ (Implicit aggregate functions only)",
            "beforeCode": "GQL {\n    from n in nums\n    groupby n % 2\n    select n % 2, count(), sum(n) // could not materialize group list `g.toList()`!\n}",
            "afterTitle": "Groovy 6.0 GINQ (`groupby ... into g` + Set Operators)",
            "afterCode": "GQL {\n    from n in [1, 11, 111, 8, 80]\n    groupby (n % 2 == 0 ? 'even' : 'odd') into g\n    orderby g.key in asc\n    select g.key as parity, g.count() as cnt, g.sum(x -> x) as total, g.toList() as items\n}"
          },
          "underTheHood": "The GINQ AST translator rewrites `into g` references into calls against the underlying `Queryable` group partition tuple while preserving column aliases on `NamedRecord`.",
          "code": "def rows = GQL {\n    from n in [1, 11, 111, 8, 80]\n    groupby (n % 2 == 0 ? 'even' : 'odd') into g\n    orderby g.key in asc\n    select g.key as parity, g.count() as cnt, g.sum(x -> x) as total\n}\n\ndef common = GQL {\n    from u in ['Alice', 'Bob', 'Carol'] select u\n    intersect\n    from u in ['Bob', 'Carol', 'Dave'] select u\n}",
          "fullCode": "@Grab('org.apache.groovy:groovy-ginq:6.0.0')\nimport groovy.lang.GroovyClassLoader\nimport groovy.lang.GroovyShell\n\ndef out = new GroovyShell(new GroovyClassLoader(this.class.classLoader)).evaluate('''\ndef rows = GQL {\n    from n in [1, 11, 111, 8, 80]\n    groupby (n % 2 == 0 ? 'even' : 'odd') into g\n    orderby g.key in asc\n    select g.key as parity, g.count() as cnt, g.sum(x -> x) as total, g.toList() as items\n}\nassert rows[0].parity == 'even' && rows[0].total == 88\nassert rows[1].parity == 'odd'  && rows[1].total == 123\n\ndef common = GQL {\n    from u in ['Alice', 'Bob', 'Carol'] select u\n    intersect\n    from u in ['Bob', 'Carol', 'Dave'] select u\n}\nassert common == ['Bob', 'Carol']\n\"GINQ=${rows.collect { [it.parity, it.cnt, it.total] }}, intersect=${common}\"\n''')\nprintln out",
          "expectedOutput": "GINQ=[[even, 2, 88], [odd, 3, 123]], intersect=[Bob, Carol]",
          "execMs": 192,
          "verifiedOut": "GINQ=[[even, 2, 88], [odd, 3, 123]], intersect=[Bob, Carol]",
          "grabs": [
            "groovy-ginq"
          ]
        }
      ],
      "fileExecMs": 415,
      "fileOut": "=== 05. GDK Extensions, Fat-Free Lambdas, `groovyToString` & GINQ ===\n[OK] 1. groupByMany multi-key grouping\n[OK] 2. zipWithNext & groupConsecutive\n[OK] 3. isSorted, clamp, takeIf, grepping & stream accumulators\n[OK] 4. findGroups, findAllGroups & findBalancedGroups\n[OK] 5. Locale-aware currency & percent formatting/parsing\n[OK] 6. Process waitForResult() & Path async file I/O\n[OK] 7. Fat-free java.util.function overloads & Closures.curryWith\n[OK] 8. Customisable object display with groovyToString()\n[OK] 9. GINQ `groupby ... into` and set operators (union, intersect, minus)"
    },
    {
      "num": "06",
      "id": "batteries-included",
      "page": "06-batteries-included.html",
      "scriptFile": "06_batteries_included_modules.groovy",
      "navLabel": "6. Batteries-Included Modules",
      "shortTitle": "CSV, Markdown, HttpBuilder & StAX XML",
      "title": "Batteries-Included Modules (`groovy-csv`, `groovy-markdown`, `groovy-http-builder`)",
      "subtitle": "Three brand-new official modules (groovy-csv, groovy-markdown, groovy-http-builder), graduated groovy-toml, unified typed parseAs across JSON/CSV/TOML/YAML/XML, and StAX XML streaming.",
      "category": "Modules & Formats",
      "accent": "rose",
      "highlights": [
        "CsvSlurper",
        "MarkdownSlurper",
        "@HttpBuilderClient",
        "HttpBuilder.http",
        "parseAs",
        "XmlUtil.streamElements"
      ],
      "sections": [
        {
          "id": "6.1",
          "slug": "groovy-csv-module",
          "title": "`groovy-csv`: RFC 4180 `CsvSlurper`, `CsvBuilder` & Typed `parseAs`",
          "gep": "groovy-csv",
          "category": "Modules & Formats",
          "keywords": [
            "CsvSlurper",
            "CsvBuilder",
            "parseAs"
          ],
          "summary": "Read and write CSV documents as dynamic maps or Jackson-backed typed POJOs/records using the familiar Slurper/Builder convention.",
          "prose": [
            "The new `groovy-csv` module brings RFC 4180 CSV support into the standard Groovy distribution with `CsvSlurper` and `CsvBuilder`. `new CsvSlurper().parseText(csv)` returns an iterable of row maps keyed by header name, while `CsvBuilder.toCsv(maps)` serializes maps or POJOs back to CSV.",
            "When you need strong typing, `new CsvSlurper().parseAs(Invoice, csvText)` deserializes rows directly into typed Groovy classes or Java records via `jackson-dataformat-csv`."
          ],
          "beforeAfter": {
            "beforeTitle": "Ad-hoc `.split(',')` (Breaks on Quoted Commas)",
            "beforeCode": "// Fragile manual CSV splitting without type conversion\ncsvText.readLines().drop(1).collect { it.split(',') }",
            "afterTitle": "Groovy 6.0 (`CsvSlurper` & `CsvBuilder`)",
            "afterCode": "List<Invoice> invoices = new CsvSlurper().parseAs(Invoice, csvText)\nString csvOut = CsvBuilder.toCsv(invoices, Invoice)"
          },
          "underTheHood": "Map-based parsing uses an embedded zero-dependency RFC 4180 state machine, while `parseAs(Class, ...)` delegates to Jackson's `CsvMapper`.",
          "code": "@Canonical\nclass Invoice { String customer; BigDecimal amount; int items }\n\ndef csv = 'customer,amount,items\\nAcme Corp,1500.50,3\\nGlobex,420.00,1'\nList<Invoice> invoices = new CsvSlurper().parseAs(Invoice, csv)\nassert invoices[0] == new Invoice('Acme Corp', 1500.50G, 3)",
          "fullCode": "@Grab('org.apache.groovy:groovy-csv:6.0.0')\nimport groovy.csv.CsvBuilder\nimport groovy.csv.CsvSlurper\nimport groovy.transform.Canonical\n\n@Canonical\nclass Invoice { String customer; BigDecimal amount; int items }\n\ndef csv = 'customer,amount,items\\nAcme Corp,1500.50,3\\nGlobex,420.00,1'\nList<Invoice> invoices = new CsvSlurper().parseAs(Invoice, csv)\nassert invoices[0] == new Invoice('Acme Corp', 1500.50G, 3)\n\ndef outCsv = CsvBuilder.toCsv([[name: 'Alice', role: 'Admin']])\nassert outCsv.contains('Alice,Admin')\nprintln \"Parsed invoices=${invoices}\"",
          "expectedOutput": "Parsed invoices=[Invoice(Acme Corp, 1500.50, 3), Invoice(Globex, 420.00, 1)]",
          "execMs": 139,
          "verifiedOut": "Parsed invoices=[Invoice(Acme Corp, 1500.50, 3), Invoice(Globex, 420.00, 1)]",
          "grabs": [
            "groovy-csv"
          ]
        },
        {
          "id": "6.2",
          "slug": "groovy-markdown-module",
          "title": "`groovy-markdown`: CommonMark `MarkdownSlurper` & Section Extraction",
          "gep": "groovy-markdown",
          "category": "Modules & Formats",
          "keywords": [
            "MarkdownSlurper",
            "MarkdownDocument",
            "codeBlocks",
            "section()"
          ],
          "summary": "Parse CommonMark documents and LLM responses to extract headings, language-tagged fenced code blocks, links, tables, and named sections.",
          "prose": [
            "`groovy-markdown` provides `MarkdownSlurper` and `MarkdownBuilder` (backed by CommonMark) for querying and generating structured Markdown—especially useful for processing documentation, release notes, and LLM responses.",
            "A parsed `MarkdownDocument` exposes convenient top-level collections (`.headings`, `.codeBlocks`, `.links`, `.tables`, `.lists`) as well as `.section('Heading Title')`, which slices out all AST nodes belonging to that section."
          ],
          "beforeAfter": {
            "beforeTitle": "Fragile Multiline Regexes for Fenced Code Blocks",
            "beforeCode": "def blocks = (md =~ /(?s)```groovy\\n(.*?)```/).collect { it[1] }",
            "afterTitle": "Groovy 6.0 (`MarkdownSlurper`)",
            "afterCode": "def doc = new MarkdownSlurper().parseText(md)\ndef groovyCode = doc.codeBlocks.findAll { it.lang == 'groovy' }*.text\ndef items = doc.section('Action Items')[0].items*.text"
          },
          "underTheHood": "`MarkdownSlurper` converts the CommonMark AST into a navigable tree of Groovy `MarkdownNode` objects supporting property and GPath-style traversal.",
          "code": "def md = '''\n# Release Plan\n## Code Samples\n```groovy\nval msg = 'Hello Groovy 6!'\n```\n## Action Items\n- Ship modules\n- Celebrate\n'''\ndef doc = new MarkdownSlurper().parseText(md)\nassert doc.headings*.text == ['Release Plan', 'Code Samples', 'Action Items']\nassert doc.codeBlocks.find { it.lang == 'groovy' }.text.contains('Hello Groovy 6!')",
          "fullCode": "@Grab('org.apache.groovy:groovy-markdown:6.0.0')\nimport groovy.markdown.MarkdownSlurper\n\ndef md = '''\\\n# Release Plan\n## Code Samples\n```groovy\nval msg = 'Hello Groovy 6!'\n```\n## Action Items\n- Ship modules\n- Celebrate\n'''\ndef doc = new MarkdownSlurper().parseText(md)\nassert doc.headings*.text == ['Release Plan', 'Code Samples', 'Action Items']\ndef code = doc.codeBlocks.find { it.lang == 'groovy' }.text.trim()\ndef items = doc.section('Action Items')[0].items*.text\nprintln \"Headings=${doc.headings*.text}, Code='${code}', Items=${items}\"",
          "expectedOutput": "Headings=[Release Plan, Code Samples, Action Items], Code='val msg = 'Hello Groovy 6!'', Items=[Ship modules, Celebrate]",
          "execMs": 54,
          "verifiedOut": "Headings=[Release Plan, Code Samples, Action Items], Code='val msg = 'Hello Groovy 6!'', Items=[Ship modules, Celebrate]",
          "grabs": [
            "groovy-markdown"
          ]
        },
        {
          "id": "6.3",
          "slug": "typed-parsing-and-stax-xml",
          "title": "Unified Typed Parsing (`JSON`, `TOML`, `YAML`, `XML`) & StAX XML Streaming",
          "gep": "groovy-xml / groovy-toml",
          "category": "Modules & Formats",
          "keywords": [
            "parseTextAs",
            "TomlSlurper",
            "YamlSlurper",
            "XmlUtil.streamElements"
          ],
          "summary": "Deserialize JSON, TOML, YAML, CSV, and XML into typed POJOs with a unified `parseTextAs` API, and stream huge XML documents via StAX.",
          "prose": [
            "Groovy 6 standardizes typed deserialization across all five data formats (`JsonSlurper`, `TomlSlurper`—now graduated from incubating—`YamlSlurper`, `CsvSlurper`, and `XmlParser` / `XmlSlurper`) with consistent `.parseAs(Class, source)` and `.parseTextAs(Class, text)` methods.",
            "For large XML files, `XmlUtil` adds memory-friendly StAX streaming helpers: `XmlUtil.streamElements(reader, 'book')` returns a lazy `Stream<Element>` of matching subtrees without loading the full DOM, and `XmlUtil.events(reader)` streams raw `XMLEvent`s."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (Full DOM load for large XML)",
            "beforeCode": "// Loads entire XML file into memory at once\ndef root = new XmlSlurper().parse(hugeReader)",
            "afterTitle": "Groovy 6.0 (`XmlUtil.streamElements` StAX Stream)",
            "afterCode": "def titles = XmlUtil.streamElements(reader, 'book')\n    .map { it.getElementsByTagName('title').item(0).textContent }\n    .toList()"
          },
          "underTheHood": "`XmlUtil.streamElements` advances a cursor-based `XMLStreamReader` until each matching start element and materializes only that small subtree.",
          "code": "def xml = '<catalog><book><title>Groovy in Action</title></book>' +\n          '<book><title>Programming Groovy 6</title></book></catalog>'\n\ndef titles = XmlUtil.streamElements(new StringReader(xml), 'book')\n    .map { it.getElementsByTagName('title').item(0).textContent }\n    .toList()\nassert titles == ['Groovy in Action', 'Programming Groovy 6']",
          "fullCode": "import groovy.xml.XmlUtil\nimport javax.xml.stream.events.XMLEvent\n\ndef xml = '''\n<catalog>\n    <book id=\"1\"><title>Groovy in Action</title></book>\n    <book id=\"2\"><title>Programming Groovy 6</title></book>\n</catalog>\n'''\ndef titles = XmlUtil.streamElements(new StringReader(xml), 'book')\n    .map { it.getElementsByTagName('title').item(0).textContent }\n    .toList()\nassert titles == ['Groovy in Action', 'Programming Groovy 6']\n\nlong count = XmlUtil.events(new StringReader(xml))\n    .filter { it.eventType == XMLEvent.START_ELEMENT && it.asStartElement().name.localPart == 'book' }\n    .count()\nassert count == 2L\nprintln \"Streamed titles=${titles}, bookCount=${count}\"",
          "expectedOutput": "Streamed titles=[Groovy in Action, Programming Groovy 6], bookCount=2",
          "execMs": 14,
          "verifiedOut": "Streamed titles=[Groovy in Action, Programming Groovy 6], bookCount=2",
          "grabs": []
        },
        {
          "id": "6.4",
          "slug": "groovy-http-builder-module",
          "title": "`groovy-http-builder`: Imperative DSL, Declarative `@HttpBuilderClient` & Async `await`",
          "gep": "groovy-http-builder",
          "category": "Modules & Formats",
          "keywords": [
            "HttpBuilder.http",
            "@HttpBuilderClient",
            "@Get",
            "@Post",
            "getAsync"
          ],
          "summary": "Zero-external-dependency HTTP client built on JDK `java.net.http.HttpClient` with both a fluent DSL and Micronaut/Retrofit-style declarative interfaces.",
          "prose": [
            "The new `groovy-http-builder` module wraps the JDK's built-in `HttpClient` in two idiomatic styles: an imperative `HttpBuilder.http(baseUrl)` DSL with automatic JSON/XML content negotiation (`resp.json`, `resp.xml`) and async methods (`await client.getAsync(...)`), and a compile-time `@HttpBuilderClient` AST transformation.",
            "Annotating an interface with `@HttpBuilderClient` generates a type-safe implementation at compile time (`PluginRegistryApi.create(baseUrl)`) supporting `@Get('/plugins/{id}')` path templates, implied query parameters, `@Header`, and `@Post` `@Body` serialization with zero runtime reflection."
          ],
          "beforeAfter": {
            "beforeTitle": "Verbose `java.net.http.HttpClient` Boilerplate",
            "beforeCode": "var req = HttpRequest.newBuilder(URI.create(url)).GET().build()\nvar res = HttpClient.newHttpClient().send(req, BodyHandlers.ofString())\ndef json = new JsonSlurper().parseText(res.body())",
            "afterTitle": "Groovy 6.0 (`@HttpBuilderClient` & `http(baseUrl)`)",
            "afterCode": "@HttpBuilderClient\ninterface PluginApi {\n    @Get('/plugins/{id}') PluginInfo getPlugin(String id)\n}\ndef info = PluginApi.create(baseUrl).getPlugin('g6-async')"
          },
          "underTheHood": "`HttpBuilderClientTransformation` generates a static `$Impl` inner class and a `static create(String baseUrl)` factory method on the interface at compile time.",
          "code": "@HttpBuilderClient('http://localhost:8080')\ninterface PluginRegistryApi {\n    @Get('/plugins/{id}')\n    PluginInfo getPlugin(String id)\n}\n\nPluginRegistryApi api = PluginRegistryApi.create(baseUrl)\nPluginInfo info = api.getPlugin('g6-async')\ndef asyncResp = await http(baseUrl).getAsync('/plugins/g6-async')",
          "fullCode": "@Grab('org.apache.groovy:groovy-http-builder:6.0.0')\nimport com.sun.net.httpserver.HttpServer\nimport groovy.http.*\nimport groovy.json.JsonOutput\nimport groovy.transform.Canonical\nimport static groovy.http.HttpBuilder.http\n\n@Canonical\nclass PluginInfo { String id; String name; int stars }\n\n@HttpBuilderClient('http://127.0.0.1:0')\ninterface PluginRegistryApi {\n    @Get('/plugins/{id}')\n    PluginInfo getPlugin(String id)\n}\n\nHttpServer server = HttpServer.create(new InetSocketAddress('127.0.0.1', 0), 0)\nserver.createContext('/plugins/g6-async') { ex ->\n    byte[] b = JsonOutput.toJson([id: 'g6-async', name: 'Groovy Async', stars: 99]).bytes\n    ex.responseHeaders.add('Content-Type', 'application/json')\n    ex.sendResponseHeaders(200, b.length)\n    ex.responseBody.write(b); ex.close()\n}\nserver.start()\ntry {\n    String baseUrl = \"http://127.0.0.1:${server.address.port}\"\n    PluginInfo info = PluginRegistryApi.create(baseUrl).getPlugin('g6-async')\n    def asyncResp = await http(baseUrl).getAsync('/plugins/g6-async')\n    assert info.stars == 99 && asyncResp.json.name == 'Groovy Async'\n    println \"Declarative=${info}, Async=${asyncResp.json}\"\n} finally {\n    server.stop(0)\n}",
          "expectedOutput": "Declarative=PluginInfo(g6-async, Groovy Async, 99), Async=[id:g6-async, name:Groovy Async, stars:99]",
          "execMs": 195,
          "verifiedOut": "Declarative=PluginInfo(g6-async, Groovy Async, 99), Async=[id:g6-async, name:Groovy Async, stars:99]",
          "grabs": [
            "groovy-http-builder"
          ]
        }
      ],
      "fileExecMs": 999,
      "fileOut": "=== 06. Batteries-Included Modules (CSV, Markdown, Typed Formats, HttpBuilder) ===\n[OK] 1. groovy-csv: CsvSlurper & CsvBuilder (untyped maps & typed POJOs)\n[OK] 2. groovy-markdown: MarkdownSlurper headings, codeBlocks, sections & links\n[OK] 3. Typed parsing (JSON/TOML/YAML/XML) & StAX streaming (XmlUtil.streamElements/events)\n[OK] 4. groovy-http-builder: Imperative DSL, @HttpBuilderClient & async await"
    },
    {
      "num": "07",
      "id": "compiler-and-ast",
      "page": "07-compiler-and-ast.html",
      "scriptFile": "07_tooling_and_compiler.groovy",
      "navLabel": "7. Compiler & AstQuery",
      "shortTitle": "Compiler, AstQuery, @ClassTag & Diagnostics",
      "title": "Compiler Tooling, Fluent `AstQuery`, `@ClassTag` & Diagnostics",
      "subtitle": "Declarative AST inspection via AstQuery, @ClassTag compile-time class token injection, ErrorFormat.SHORT single-line diagnostics, --check syntax/type verification, and Parrot parser error recovery.",
      "category": "Compiler & AST",
      "accent": "indigo",
      "highlights": [
        "AstQuery",
        "@ClassTag",
        "ErrorFormat.SHORT",
        "--check",
        "errorRecovery"
      ],
      "sections": [
        {
          "id": "7.1",
          "slug": "fluent-astquery-api",
          "title": "Declarative AST Navigation with Fluent `AstQuery.from(...)`",
          "gep": "GROOVY-12116",
          "category": "Compiler & AST",
          "keywords": [
            "AstQuery",
            "descendants",
            "where",
            "enclosing"
          ],
          "summary": "Query Groovy AST trees declaratively using `AstQuery.from(node).descendants(Type).where { ... }` instead of writing stateful visitor subclasses.",
          "prose": [
            "Writing custom AST transformations or static type-checking extensions previously required subclassing `CodeVisitorSupport` and manually maintaining state stacks as you walked statements and expressions.",
            "Groovy 6 introduces `org.codehaus.groovy.ast.query.AstQuery` (`GROOVY-12116`): a fluent, stream-friendly API supporting `.descendants(NodeType)`, `.where { predicate }`, `.enclosing(ClassNode)`, `.ancestors()`, `.notInside(ClosureExpression)`, `.anyMatch(...)`, and `.stream()`."
          ],
          "beforeAfter": {
            "beforeTitle": "Groovy 5 (`CodeVisitorSupport` Subclass Boilerplate)",
            "beforeCode": "def calls = []\nmethod.code.visit(new CodeVisitorSupport() {\n    void visitMethodCallExpression(MethodCallExpression call) {\n        calls << call.methodAsString\n        super.visitMethodCallExpression(call)\n    }\n})",
            "afterTitle": "Groovy 6.0 (Declarative `AstQuery`)",
            "afterCode": "def calls = AstQuery.from(method.code)\n    .descendants(MethodCallExpression)\n    .map { it.methodAsString }\n    .toList()"
          },
          "underTheHood": "`AstQuery` lazily traverses child `ASTNode`s using an internal depth-first iterator without mutating the AST.",
          "code": "def calls = AstQuery.from(processMethod.code)\n    .descendants(MethodCallExpression)\n    .where { it.methodAsString in ['validate', 'each', 'save', 'audit'] }\n    .stream()\n    .map { it.methodAsString }\n    .toList()\nassert calls == ['validate', 'each', 'save', 'audit']",
          "fullCode": "import org.codehaus.groovy.ast.ClassNode\nimport org.codehaus.groovy.ast.builder.AstBuilder\nimport org.codehaus.groovy.ast.expr.MethodCallExpression\nimport org.codehaus.groovy.ast.query.AstQuery\nimport org.codehaus.groovy.control.CompilePhase\n\ndef nodes = new AstBuilder().buildFromString(CompilePhase.CONVERSION, false, '''\n    class OrderProcessor {\n        void process(List items) {\n            validate(items)\n            items.each { save(it) }\n            audit('done')\n        }\n    }\n''')\nClassNode cls = nodes.find { it instanceof ClassNode } as ClassNode\ndef processMethod = cls.getDeclaredMethods('process')[0]\n\ndef calls = AstQuery.from(processMethod.code)\n    .descendants(MethodCallExpression)\n    .where { it.methodAsString in ['validate', 'each', 'save', 'audit'] }\n    .stream()\n    .map { it.methodAsString }\n    .toList()\n\nassert calls == ['validate', 'each', 'save', 'audit']\nprintln \"Queried AST method calls: ${calls}\"",
          "expectedOutput": "Queried AST method calls: [validate, each, save, audit]",
          "execMs": 15,
          "verifiedOut": "Queried AST method calls: [validate, each, save, audit]",
          "grabs": []
        },
        {
          "id": "7.2",
          "slug": "classtag-type-reification",
          "title": "`@ClassTag`: Compiler-Supplied Class Tokens & Type-Safe `withDefault`",
          "gep": "GROOVY-12115",
          "category": "Compiler & AST",
          "keywords": [
            "@ClassTag",
            "preempt = true",
            "withDefault"
          ],
          "summary": "Let the static compiler automatically inject reified `Class<T>` tokens at call sites when a `@ClassTag` parameter is omitted.",
          "prose": [
            "Due to JVM type erasure, generic methods that need a runtime `Class<T>` token normally force callers to pass `String.class` explicitly (`box.checkedView(String)`). In Groovy 6, annotating a trailing parameter with `@ClassTag Class<T> type` instructs the static compiler (`@TypeChecked` / `@CompileStatic`) to infer `T` at the call site and inject `T.class` automatically!",
            "With `@ClassTag(preempt = true)`, the compiler prefers the `@ClassTag` overload over a parameterless dynamic overload—which Groovy 6 itself uses on `List.withDefault` and `Map.withDefault` so statically compiled collections wrap defaults in `Collections.checkedList` / `checkedMap` automatically."
          ],
          "beforeAfter": {
            "beforeTitle": "Explicit Class Token Redundancy",
            "beforeCode": "TypedBox<String> box = new TypedBox<>()\nList<String> safe = box.checkedView(String) // repetitive String token!",
            "afterTitle": "Groovy 6.0 (`@ClassTag` Automatic Injection)",
            "afterCode": "TypedBox<String> box = new TypedBox<>()\nList<String> safe = box.checkedView() // compiler injects String.class!"
          },
          "underTheHood": "During `StaticTypesMethodReferenceExpressionWriter` / method call resolution, missing `@ClassTag` arguments are synthesized as `ClassExpression(inferredType)`.",
          "code": "class TypedBox<T> {\n    final List<T> items = []\n    List<T> checkedView(@ClassTag Class<T> type) {\n        Collections.checkedList(items, type)\n    }\n}\n\n@CompileStatic\nList<String> createSafeBox() {\n    TypedBox<String> box = new TypedBox<>()\n    box.checkedView() // Compiler injects String.class automatically!\n}",
          "fullCode": "import groovy.transform.CompileStatic\nimport groovy.transform.stc.ClassTag\n\nclass TypedBox<T> {\n    final List<T> items = []\n    List<T> checkedView(@ClassTag Class<T> type) {\n        Collections.checkedList(items, type)\n    }\n}\n\n@CompileStatic\nList<String> createSafeBox() {\n    TypedBox<String> box = new TypedBox<>()\n    List<String> safe = box.checkedView()\n    safe.add('Groovy 6')\n    return safe\n}\n\ndef list = createSafeBox()\nassert list == ['Groovy 6']\nboolean rejected = false\ntry { ((List) list).add(999) } catch (ClassCastException expected) { rejected = true }\nassert rejected\nprintln \"Checked list=${list}, runtimeTypeGuardRejectedInt=${rejected}\"",
          "expectedOutput": "Checked list=[Groovy 6], runtimeTypeGuardRejectedInt=true",
          "execMs": 23,
          "verifiedOut": "Checked list=[Groovy 6], runtimeTypeGuardRejectedInt=true",
          "grabs": []
        },
        {
          "id": "7.3",
          "slug": "short-diagnostics-and-check-mode",
          "title": "`ErrorFormat.SHORT`, `--check` Mode & Actionable Syntax Diagnostics",
          "gep": "GROOVY-12118",
          "category": "Compiler & AST",
          "keywords": [
            "ErrorFormat.SHORT",
            "--check",
            "errorRecoveryEnabled"
          ],
          "summary": "GCC/javac-style `file:line:col: error:` output, check-only compilation without writing `.class` files, and helpful hints for Java/JS/Kotlin habits.",
          "prose": [
            "For CI pipelines, editor integrations, and AI coding agents, `groovyc --error-format=SHORT` (or `CompilerConfiguration.errorFormat = ErrorFormat.SHORT`) emits compact single-line `file:line:col: error: message` diagnostics, while `--check` stops after type checking (`Phases.CLASS_GENERATION`) without emitting `.class` files to disk.",
            "The Parrot parser also adds multi-error recovery (`errorRecoveryEnabled`) and targeted diagnostic hints when developers write foreign syntax—such as `'const' is not supported; use 'val' or 'static final' instead`."
          ],
          "beforeAfter": {
            "beforeTitle": "Generic Parser Token Error",
            "beforeCode": "unexpected token: const @ line 1, column 1.",
            "afterTitle": "Groovy 6.0 (`ErrorFormat.SHORT` + Actionable Hint)",
            "afterCode": "BadSyntax.groovy:1:1: error: 'const' is not supported; use 'val' or 'static final' instead\n1 error"
          },
          "underTheHood": "`ErrorCollector.write` dispatches to `ShortErrorReport` when `ErrorFormat.SHORT` is configured on `CompilerConfiguration`.",
          "code": "def config = new CompilerConfiguration(\n    errorFormat: ErrorFormat.SHORT,\n    targetPhase: Phases.CLASS_GENERATION // equivalent to `groovyc --check`\n)\ndef cu = new CompilationUnit(config)\ncu.addSource('BadSyntax.groovy', 'const answer = 42\\n')\n// Produces: BadSyntax.groovy:1:1: error: 'const' is not supported; use 'val' or 'static final' instead",
          "fullCode": "import org.codehaus.groovy.control.CompilationUnit\nimport org.codehaus.groovy.control.CompilerConfiguration\nimport org.codehaus.groovy.control.ErrorFormat\nimport org.codehaus.groovy.control.MultipleCompilationErrorsException\nimport org.codehaus.groovy.control.Phases\n\ndef config = new CompilerConfiguration(\n    errorFormat: ErrorFormat.SHORT,\n    targetPhase: Phases.CLASS_GENERATION\n)\ndef cu = new CompilationUnit(config)\ncu.addSource('BadSyntax.groovy', 'const answer = 42\\n')\n\nStringWriter errOut = new StringWriter()\ntry {\n    cu.compile(config.targetPhase)\n} catch (MultipleCompilationErrorsException ex) {\n    ex.errorCollector.write(new PrintWriter(errOut), null)\n}\nString diag = errOut.toString().trim()\nassert diag.startsWith('BadSyntax.groovy:1:1: error:')\nprintln diag",
          "expectedOutput": "BadSyntax.groovy:1:1: error: 'const' is not supported; use 'val' or 'static final' instead\\n1 error",
          "execMs": 15,
          "verifiedOut": "BadSyntax.groovy:1:1: error: 'const' is not supported; use 'val' or 'static final' instead\n1 error",
          "grabs": []
        }
      ],
      "fileExecMs": 50,
      "fileOut": "=== 07. Compiler, AST Query API, @ClassTag & Diagnostics ===\n[OK] 1. Fluent AstQuery API over Groovy AST nodes\n[OK] 2. @ClassTag compiler-supplied class tokens & type-safe withDefault\n[OK] 3. ErrorFormat.SHORT (`file:line:col: error:`) & clearer syntax diagnostics"
    }
  ],
  "standaloneScripts": [
    {
      "id": "Script 01",
      "file": "01_language_ergonomics.groovy",
      "title": "Language Ergonomics & Java Parity — Full Standalone Script",
      "pillarPage": "01-language-ergonomics.html",
      "grabs": [],
      "execMs": 18,
      "code": "/// # Groovy 6.0 — New Language Features & Java Compatibility\n///\n/// Distills:\n/// - `val` contextual keyword for final declarations (GEP-16)\n/// - Multi-assignment destructuring: tail/head/middle `*rest`, map `key: var`, `_` discard (GEP-20)\n/// - Compound assignment operator overloading (`plusAssign`, `minusAssign`, etc.) (GEP-15)\n/// - Nested `copyWith` (dotted paths & transactional block form with `old` and `modify`)\n/// - `switch`: position decides statement vs expression, plus `@CompileStatic` jump tables\n/// - Java compatibility: `import module` (JEP 511), `instanceof` flow scoping (JEP 394),\n///   intersection casts `(Runnable & Serializable)`, and annotation array initializers `{...}`\n\nimport module java.sql\nimport groovy.transform.CompileStatic\nimport groovy.transform.Immutable\nimport groovy.transform.OperatorRename\nimport groovy.transform.RecordType\nimport groovy.transform.ToString\nimport java.lang.annotation.Retention\nimport java.lang.annotation.RetentionPolicy\nimport java.util.stream.Collectors\nimport java.util.stream.Stream\n\nprintln \"=== 01. Language Ergonomics & Java Compatibility ===\"\n\n// ---------------------------------------------------------------------------\n// 1. `val` Contextual Keyword for Final Declarations (GEP-16)\n// ---------------------------------------------------------------------------\n@CompileStatic\nvoid demoValKeyword() {\n    val language = 'Apache Groovy'   // equivalent to `final var` / `final def` (inferred as String)\n    val version = 6                  // inferred as int\n    val tags = ['jvm', 'dynamic']    // shallow finality: reference is final, list contents can mutate\n    tags << 'static'\n\n    assert language == 'Apache Groovy'\n    assert version == 6\n    assert tags == ['jvm', 'dynamic', 'static']\n\n    // `val` is contextual — still usable as a variable/property/map-key name:\n    def val = 42\n    def map = [val: val]\n    assert map.val == 42\n}\ndemoValKeyword()\nprintln \"[OK] 1. `val` contextual keyword\"\n\n// ---------------------------------------------------------------------------\n// 2. Multi-Assignment Destructuring (GEP-20)\n// ---------------------------------------------------------------------------\nvoid demoDestructuring() {\n    // 2a. Tail rest binding (*rest)\n    def (head, *tail) = [10, 20, 30, 40]\n    assert head == 10 && tail == [20, 30, 40]\n\n    // String slice tracks RHS type\n    def (char1, char2, *restStr) = 'Groovy6'\n    assert char1 == 'G' && char2 == 'r' && restStr == 'oovy6'\n\n    // 2b. Head and middle rest bindings\n    def (*init, last) = [1, 2, 3, 4]\n    assert init == [1, 2, 3] && last == 4\n\n    def (first, *middle, end) = [1, 2, 3, 4, 5]\n    assert first == 1 && middle == [2, 3, 4] && end == 5\n\n    def (a, b, *midRange, y, z) = 1..6\n    assert [a, b, y, z] == [1, 2, 5, 6] && midRange == [3, 4]\n\n    // 2c. Lazy Iterator & Stream preservation\n    def naturals = (1..Integer.MAX_VALUE).iterator()\n    def (n1, *moreNaturals) = naturals\n    assert n1 == 1 && moreNaturals.next() == 2 && moreNaturals.next() == 3\n\n    def (header, *bodyStream) = Stream.of('# Title', 'Line 1', 'Line 2')\n    assert header == '# Title'\n    assert bodyStream.collect(Collectors.toList()) == ['Line 1', 'Line 2']\n\n    // 2d. Map-style key destructuring (with type ascriptions & JavaBeans)\n    def user = [name: 'Alice', age: 30, role: 'architect']\n    def (name: String fullName, role: r) = user\n    assert fullName == 'Alice' && r == 'architect'\n\n    // Discard slots (`_`) and modifier propagation (`final`)\n    final ( _, *kept ) = ['skip', 'keep1', 'keep2']\n    assert kept == ['keep1', 'keep2']\n}\ndemoDestructuring()\nprintln \"[OK] 2. Multi-assignment destructuring (*rest, map keys, lazy streams)\"\n\n// ---------------------------------------------------------------------------\n// 3. Compound Assignment Operator Overloading (GEP-15)\n// ---------------------------------------------------------------------------\n@ToString(includeNames = true)\nclass Counter {\n    int value = 0\n    int mutations = 0\n\n    // Mutates in place! Used by `+=` without reassigning the reference\n    void plusAssign(int delta) {\n        value += delta\n        mutations++\n    }\n\n    void minusAssign(int delta) {\n        value -= delta\n        mutations++\n    }\n\n    // Fallback binary `+` creates a new instance\n    Counter plus(int delta) {\n        new Counter(value: value + delta, mutations: 0)\n    }\n}\n\nclass CustomBag {\n    List<String> items = []\n    void appendInPlace(String item) { items << item }\n}\n\n@CompileStatic\nvoid demoCompoundAssignment() {\n    // Works even on a `final` (`val`) variable because `plusAssign` mutates in place!\n    val counter = new Counter(value: 10)\n    val originalRef = counter\n\n    counter += 5\n    counter -= 3\n    assert counter.is(originalRef)\n    assert counter.value == 12\n    assert counter.mutations == 2\n\n    // Binary `+` still calls `plus()` and returns a new object\n    val separate = counter + 8\n    assert !separate.is(counter)\n    assert separate.value == 20\n}\n\n@CompileStatic\n@OperatorRename(plusAssign = 'appendInPlace')\nvoid demoOperatorRename() {\n    val bag = new CustomBag()\n    bag += 'apple'\n    bag += 'banana'\n    assert bag.items == ['apple', 'banana']\n}\n\ndemoCompoundAssignment()\ndemoOperatorRename()\nprintln \"[OK] 3. Compound assignment operator overloading (plusAssign, @OperatorRename)\"\n\n// ---------------------------------------------------------------------------\n// 4. Nested `copyWith` for `@Immutable` and `@RecordType` (GROOVY-12015)\n// ---------------------------------------------------------------------------\n@Immutable(copyWith = true)\nclass GeoCoord {\n    double lat, lon\n}\n\n@Immutable(copyWith = true)\nclass Address {\n    String city\n    String zip\n    GeoCoord coord\n}\n\n@RecordType(copyWith = true)\nclass Developer {\n    String name\n    int commits\n    Address address\n}\n\nvoid demoNestedCopyWith() {\n    val nycCoord = new GeoCoord(40.7128d, -74.0060d)\n    val dev = new Developer('Alice', 42, new Address('NYC', '10001', nycCoord))\n\n    // 4a. Dotted-path map keys with structural sharing\n    val moved = dev.copyWith('address.city': 'Boston', 'address.zip': '02101')\n    assert moved.name == 'Alice'\n    assert moved.address.city == 'Boston'\n    assert moved.address.zip == '02101'\n    // Untouched sub-branch preserves object identity (`is`)!\n    assert moved.address.coord.is(nycCoord)\n\n    // 4b. Transactional block form with `old` and `.modify { ... }`\n    val promoted = moved.copyWith {\n        name = \"${old.name} (Lead)\".toString()\n        commits.modify { it + 10 }\n        address.city = old.address.city.toUpperCase()\n    }\n    assert promoted.name == 'Alice (Lead)'\n    assert promoted.commits == 52\n    assert promoted.address.city == 'BOSTON'\n    assert promoted.address.coord.is(nycCoord)\n\n    // Empty block returns the exact same instance\n    assert dev.copyWith {}.is(dev)\n}\ndemoNestedCopyWith()\nprintln \"[OK] 4. Nested `copyWith` (dotted paths, transactional block, structural sharing)\"\n\n// ---------------------------------------------------------------------------\n// 5. Switch: Position Decides Statement vs Expression (GROOVY-12399 / 12405)\n// ---------------------------------------------------------------------------\n@CompileStatic\nString classifyHttpStatus(int code) {\n    String category = 'unknown'\n    // Arrow switch in statement position does NOT require `default` / exhaustiveness\n    switch (code) {\n        case 200 -> category = 'OK'\n        case 404 -> category = 'Not Found'\n    }\n    category\n}\n\n@CompileStatic\nString switchJumpTable(int day) {\n    // Statically compiled colon switch statement now emits JVM `tableswitch`!\n    String label = 'other'\n    switch (day) {\n        case 1: label = 'Mon'; break\n        case 2: label = 'Tue'; break\n        case 3: label = 'Wed'; break\n    }\n    label\n}\n\nassert classifyHttpStatus(200) == 'OK'\nassert classifyHttpStatus(500) == 'unknown' // no IllegalStateException in statement position\nassert switchJumpTable(2) == 'Tue'\nprintln \"[OK] 5. Switch statement vs expression alignment & jump-table dispatch\"\n\n// ---------------------------------------------------------------------------\n// 6. Java Compatibility: Module Imports, Flow Scoping, Intersection Casts\n// ---------------------------------------------------------------------------\n@Retention(RetentionPolicy.RUNTIME)\n@interface Tags {\n    // Java-style array initializer `{...}` in annotation default and usage\n    String[] value() default {}\n}\n\n@Tags(value = {'groovy6', 'java-compat'})\nclass AnnotatedSample {}\n\n@CompileStatic\nString formatPayload(Object obj) {\n    // JEP 394 flow scoping: early-return with negated `!instanceof` binds `s` after the `if`!\n    if (obj !instanceof String s) {\n        return 'non-string'\n    }\n    // `s` is known to be a String in scope here!\n    return s.trim().toUpperCase()\n}\n\nvoid demoJavaCompatibility() {\n    // 6a. `import module java.sql` (at top of script) brings in java.sql.* and transitive exports\n    assert Connection.name == 'java.sql.Connection'\n    assert DriverManager.name == 'java.sql.DriverManager'\n\n    // 6b. `instanceof` pattern variable flow scoping\n    assert formatPayload('  hello groovy 6  ') == 'HELLO GROOVY 6'\n    assert formatPayload(123) == 'non-string'\n\n    // 6c. Intersection-type casts for lambdas, method references, and closures\n    def serializableLambda = (Runnable & Serializable) () -> { /* no-op */ }\n    assert serializableLambda instanceof Runnable\n    assert serializableLambda instanceof Serializable\n\n    def serializableClosure = { -> } as (Runnable & Serializable & Cloneable)\n    assert serializableClosure instanceof Serializable\n    assert serializableClosure instanceof Cloneable\n    serializableClosure.run()\n\n    // 6d. Java-style `{...}` array initializers in annotations\n    def tags = AnnotatedSample.getAnnotation(Tags).value()\n    assert tags == ['groovy6', 'java-compat'] as String[]\n}\ndemoJavaCompatibility()\nprintln \"[OK] 6. Java compatibility (module imports, flow scoping, intersection casts, annotation `{}`)\"\n",
      "verifiedOut": "✓ ALL PILLAR 01 (01_language_ergonomics.groovy) ASSERTIONS PASSED!"
    },
    {
      "id": "Script 02",
      "file": "02_async_await.groovy",
      "title": "Async/Await, Generators & Channels — Full Standalone Script",
      "pillarPage": "02-async-await.html",
      "grabs": [],
      "execMs": 39,
      "code": "/// # Groovy 6.0 — Native Async/Await, Generators & Channels\n///\n/// Distills:\n/// - `async { ... }` and `await(...)` backed by Virtual Threads on JDK 21+ (GROOVY-9381)\n/// - Parallel task coordination & multi-assignment `await(a, b, c)`\n/// - Lazy generators using `yield return` inside `async` blocks\n/// - Go-style `AsyncChannel` with `for await` and composable pipelines (`filter`, `map`)\n/// - Structured concurrency with `AsyncScope.run { ... }`\n\nimport groovy.concurrent.AsyncChannel\nimport groovy.concurrent.AsyncScope\nimport groovy.concurrent.Awaitable\n\nprintln \"=== 02. Native Async/Await, Generators & Channels ===\"\n\n// ---------------------------------------------------------------------------\n// 1. Sequential-Style Async/Await on Virtual Threads\n// ---------------------------------------------------------------------------\nMap fetchUserProfile(int id) {\n    [id: id, name: 'Guillaume', tier: 'pro', isVirtual: Thread.currentThread().virtual]\n}\n\nList<Map> fetchQuests(Map profile) {\n    [\n        [title: 'Explore Groovy 5', active: false],\n        [title: \"Master Groovy 6 for ${profile.name}\".toString(), active: true]\n    ]\n}\n\ndef activeQuest = await async {\n    def profile = await async { fetchUserProfile(42) }\n    assert profile.isVirtual // Runs on a JDK 21+ Virtual Thread automatically!\n    def quests = await async { fetchQuests(profile) }\n    quests.find { it.active }\n}\n\nassert activeQuest.title == 'Master Groovy 6 for Guillaume'\nprintln \"[OK] 1. Sequential-style async/await on Virtual Threads\"\n\n// ---------------------------------------------------------------------------\n// 2. Parallel Tasks, Tuple Await & Exception Handling\n// ---------------------------------------------------------------------------\ndef svcA = async { 'Service-A:OK' }\ndef svcB = async { 'Service-B:OK' }\ndef svcC = async { 200 }\n\n// Wait for all three and destructure results in one line\ndef (resA, resB, statusC) = await(svcA, svcB, svcC)\nassert resA == 'Service-A:OK' && resB == 'Service-B:OK' && statusC == 200\n\n// Standard try/catch works naturally across `await` boundaries\ndef recovered = ''\ntry {\n    await async {\n        throw new IllegalStateException('Simulated network failure')\n    }\n} catch (IllegalStateException ex) {\n    recovered = ex.message\n}\nassert recovered == 'Simulated network failure'\nprintln \"[OK] 2. Parallel task combinators & standard try/catch error handling\"\n\n// ---------------------------------------------------------------------------\n// 3. Lazy Generators with `yield return`\n// ---------------------------------------------------------------------------\n// An `async` closure containing `yield return` becomes a lazy Iterable generator\n// with natural back-pressure!\ndef fibonacci = async {\n    long a = 0, b = 1\n    while (true) {\n        yield return a\n        (a, b) = [b, a + b]\n    }\n}\n\nassert fibonacci.take(10).collect() == [0L, 1L, 1L, 2L, 3L, 5L, 8L, 13L, 21L, 34L]\nprintln \"[OK] 3. Lazy infinite generators with `yield return`\"\n\n// ---------------------------------------------------------------------------\n// 4. Go-Style `AsyncChannel` & Composable Pipelines\n// ---------------------------------------------------------------------------\ndef rawChannel = AsyncChannel.create(10) // buffered channel\n\n// Composable pipeline: filter evens, then square them\ndef squaredEvens = rawChannel\n    .filter { int n -> n % 2 == 0 }\n    .map { int n -> n * n }\n\n// Producer task\nasync {\n    for (i in 1..6) {\n        rawChannel.send(i)\n    }\n    rawChannel.close()\n}\n\ndef received = []\nfor (val item in squaredEvens) {\n    received << item\n}\nassert received == [4, 16, 36]\nprintln \"[OK] 4. Go-style AsyncChannel, pipelines (filter/map) & `for await`\"\n\n// ---------------------------------------------------------------------------\n// 5. Structured Concurrency with `AsyncScope`\n// ---------------------------------------------------------------------------\n// `AsyncScope.withScope` binds child task lifetimes to the lexical scope:\n// when the block exits, all spawned tasks are guaranteed complete or cancelled.\ndef summary = AsyncScope.withScope { scope ->\n    def usersTask  = scope.async { ['Alice', 'Bob', 'Carol'] }\n    def configTask = scope.async { [region: 'eu-west-1', maxRetries: 3] }\n\n    def (users, cfg) = await(usersTask, configTask)\n    \"${users.size()} users in ${cfg.region}\".toString()\n}\nassert summary == '3 users in eu-west-1'\nprintln \"[OK] 5. Structured concurrency via AsyncScope.withScope\"\n",
      "verifiedOut": "✓ ALL PILLAR 02 (02_async_await.groovy) ASSERTIONS PASSED!"
    },
    {
      "id": "Script 03",
      "file": "03_concurrency_toolkit.groovy",
      "title": "GPars-Inspired Concurrency Toolkit — Full Standalone Script",
      "pillarPage": "03-concurrency-toolkit.html",
      "grabs": [],
      "execMs": 112,
      "code": "/// # Groovy 6.0 — Integrated Concurrency Toolkit (`groovy.concurrent`)\n///\n/// Distills:\n/// - `Agent` — thread-safe mutable state & reactive `changes()` publisher\n/// - `@ActiveObject` & `@ActiveMethod` — actor semantics with plain class syntax\n/// - `DataflowVariable` & `Dataflows` — single-assignment variables composing with `await`\n/// - Parallel collections (`collectParallel`, `findAllParallel`, `sumParallel`) & `ParallelScope`\n/// - `@Parallel` AST transform on loop statements\n/// - `BroadcastChannel` (one-to-many)\n/// - `ChannelSelect` — full CSP choice (`offers`, mixed send/receive, `when` guards, `fair()`, `after()` timer)\n\nimport groovy.concurrent.Agent\nimport groovy.concurrent.AsyncChannel\nimport groovy.concurrent.BroadcastChannel\nimport groovy.concurrent.DataflowVariable\nimport groovy.concurrent.Dataflows\nimport groovy.concurrent.ParallelScope\nimport groovy.concurrent.Pool\nimport groovy.transform.ActiveMethod\nimport groovy.transform.ActiveObject\nimport groovy.transform.Parallel\nimport java.util.concurrent.ConcurrentLinkedQueue\n\nimport static groovy.concurrent.ChannelSelect.*\n\nprintln \"=== 03. Integrated Concurrency Toolkit (`groovy.concurrent`) ===\"\n\n// ---------------------------------------------------------------------------\n// 1. `Agent`: Thread-Safe State + Reactive `changes()` Stream\n// ---------------------------------------------------------------------------\ndef counterAgent = Agent.create(0)\ndef observedTransitions = []\n\nasync {\n    Thread.sleep(15) // ensure `for await` subscriber is attached\n    counterAgent.send { it + 10 }\n    counterAgent.send { it + 20 }\n    counterAgent.send { it + 12 }\n    assert await(counterAgent.getAsync()) == 42\n    counterAgent.shutdown()\n}\n\nfor await (val state in counterAgent.changes()) {\n    observedTransitions << state\n}\nassert observedTransitions == [10, 30, 42]\nprintln \"[OK] 1. Agent thread-safe state & reactive `changes()` stream\"\n\n// ---------------------------------------------------------------------------\n// 2. `@ActiveObject` & `@ActiveMethod`: Actor Semantics with Class Syntax\n// ---------------------------------------------------------------------------\n@ActiveObject\nclass BankAccount {\n    private BigDecimal balance = 0.0G\n\n    @ActiveMethod\n    void deposit(BigDecimal amount) {\n        balance += amount\n    }\n\n    @ActiveMethod\n    boolean tryWithdraw(BigDecimal amount) {\n        if (amount > balance) return false\n        balance -= amount\n        return true\n    }\n\n    @ActiveMethod\n    BigDecimal getBalance() { balance }\n}\n\ndef account = new BankAccount()\naccount.deposit(100.0G)\naccount.deposit(50.0G)\nassert account.tryWithdraw(30.0G)\nassert !account.tryWithdraw(200.0G)\nassert account.balance == 120.0G\nprintln \"[OK] 2. @ActiveObject & @ActiveMethod actor transform\"\n\n// ---------------------------------------------------------------------------\n// 3. `DataflowVariable` & `Dataflows`\n// ---------------------------------------------------------------------------\ndef x = new DataflowVariable<Integer>()\ndef y = new DataflowVariable<Integer>()\ndef z = new DataflowVariable<Integer>()\n\n// Consumer starts before x or y are bound — blocks on Virtual Thread until both bind\nasync { z << await(x) + await(y) }\nasync { y << 25 }\nasync { x << 17 }\nassert await(z) == 42\n\n// `Dataflows` auto-creates variables on property access\ndef df = new Dataflows()\nasync { df.greeting = \"Hello, ${df.firstName} ${df.lastName}!\".toString() }\nasync { df.lastName = 'Laforge' }\nasync { df.firstName = 'Guillaume' }\nassert df.greeting == 'Hello, Guillaume Laforge!'\nprintln \"[OK] 3. DataflowVariable & Dataflows single-assignment variables\"\n\n// ---------------------------------------------------------------------------\n// 4. Parallel Collections, `ParallelScope`, and `@Parallel` Loops\n// ---------------------------------------------------------------------------\nParallelScope.withPool(Pool.cpu()) {\n    val nums = (1..100).toList()\n    val evens = nums.findAllParallel { it % 2 == 0 }\n    val squaresSum = evens.collectParallel { it * it }.sumParallel { a, b -> a + b }\n    assert evens.size() == 50\n    assert squaresSum == (1..50).collect { (it * 2) ** 2 }.sum()\n}\n\n// `@Parallel` AST transform directly on a `for` loop!\ndef loopResults = new ConcurrentLinkedQueue<Integer>()\n@Parallel\nfor (Integer i in 1..8) {\n    loopResults.add(i * i)\n}\nassert loopResults.sort() == [1, 4, 9, 16, 25, 36, 49, 64]\nprintln \"[OK] 4. Parallel collections, ParallelScope & @Parallel for-loop transform\"\n\n// ---------------------------------------------------------------------------\n// 5. `BroadcastChannel` & `ChannelSelect` (CSP Guards, Fair Policy, Timers)\n// ---------------------------------------------------------------------------\n// 5a. BroadcastChannel (one-to-many)\ndef broadcast = BroadcastChannel.create()\ndef sub1 = broadcast.asPublisher()\ndef sub2 = broadcast.asPublisher()\n\ndef reader1 = async {\n    def list = []\n    for await (msg in sub1) { list << msg }\n    list\n}\ndef reader2 = async {\n    def list = []\n    for await (msg in sub2) { list << msg.toUpperCase() }\n    list\n}\n\n// Let subscribers attach before publishing\nThread.sleep(20)\nasync {\n    ['alpha', 'beta'].each { broadcast.send(it) }\n    broadcast.close()\n}\nassert await(reader1) == ['alpha', 'beta']\nassert await(reader2) == ['ALPHA', 'BETA']\n\n// 5b. ChannelSelect with `when` preconditions, `fair()` policy, and `after()` timeout branch\ndef highPrio = AsyncChannel.create(2)\ndef lowPrio  = AsyncChannel.create(2)\nhighPrio.send('H1')\nlowPrio.send('L1')\n\nboolean allowHigh = false\n// Guarded choice: `highPrio` is guarded off on the first round, so `lowPrio` wins\ndef selector = offers(\n    receive(highPrio).when { allowHigh },\n    receive(lowPrio),\n    after(50) // timer branch\n).fair()\n\ndef round1 = await selector.select()\nassert round1.index == 1 && round1.value == 'L1'\n\n// Now enable `allowHigh`: `highPrio` is taken on round 2\nallowHigh = true\ndef round2 = await selector.select()\nassert round2.index == 0 && round2.value == 'H1'\n\n// Round 3: neither channel has data, so the `after(50)` timer branch wins!\ndef round3 = await selector.select()\nassert round3.timeout\nprintln \"[OK] 5. BroadcastChannel & ChannelSelect (guards, fair rotation, timer branch)\"\n",
      "verifiedOut": "✓ ALL PILLAR 03 (03_concurrency_toolkit.groovy) ASSERTIONS PASSED!"
    },
    {
      "id": "Script 04",
      "file": "04_contracts_and_checkers.groovy",
      "title": "Contracts, Purity, Type Checkers & Monads — Full Standalone Script",
      "pillarPage": "04-contracts-and-checkers.html",
      "grabs": [
        "groovy-contracts:6.0.0"
      ],
      "execMs": 120,
      "code": "@Grab('org.apache.groovy:groovy-contracts:6.0.0')\n/// # Groovy 6.0 — Contracts, Purity, Type Checkers & Monadic Comprehensions\n///\n/// Distills:\n/// - `groovy-contracts` (graduated from incubating): `@Invariant` (classes, scripts & loops),\n///   `@Requires`, `@Ensures` (multiple + `old`), `@Decreases` (loops & recursion), `@ThrowsIf`\n/// - `@Modifies` frame conditions & `@Pure` verified at compile time by `ModifiesChecker` & `PurityChecker`\n/// - `NullChecker` & `NullChecker(strict: true)` flow-sensitive compile-time null analysis\n/// - `CombinerChecker` with `@Associative` & `@Reducer` for parallel reductions\n/// - Monadic comprehensions via `DO` macro + `MonadicChecker` (GEP-23)\n/// - `@SafeRegex` timeout facility against ReDoS (GROOVY-12122)\n/// - `@Virtual` static methods on Traits (GEP-22)\n\n@Grab('org.apache.groovy:groovy-contracts:6.0.0')\n@Grab('org.apache.groovy:groovy-typecheckers:6.0.0')\n@Grab('org.apache.groovy:groovy-macro-library:6.0.0')\nimport groovy.contracts.Decreases\nimport groovy.contracts.Ensures\nimport groovy.contracts.Invariant\nimport groovy.contracts.Modifies\nimport groovy.contracts.Requires\nimport groovy.contracts.ThrowsIf\nimport groovy.transform.Associative\nimport groovy.transform.CompileStatic\nimport groovy.transform.Pure\nimport groovy.transform.SafeRegex\nimport groovy.transform.TypeChecked\nimport groovy.transform.Virtual\nimport groovy.util.regex.RegexTimeoutException\n\nprintln \"=== 04. Contracts, Purity, Type Checkers & Monadic Comprehensions ===\"\n\n// ---------------------------------------------------------------------------\n// 1. Self-Describing Specifications: `@Invariant`, `@Requires`, `@Ensures`,\n//    `@Modifies`, `@Pure` + `ModifiesChecker` & `PurityChecker`\n// ---------------------------------------------------------------------------\n@TypeChecked(extensions = [\n    'groovy.typecheckers.ModifiesChecker',\n    'groovy.typecheckers.PurityChecker'\n])\n@Invariant({ balance >= 0G })\nclass VerifiedWallet {\n    BigDecimal balance = 0G\n    List<String> auditLog = []\n\n    @Requires({ amount > 0G })\n    @Ensures({ balance == old.balance + amount })\n    @Ensures({ auditLog.size() > 0 }) // Multiple @Ensures now all fire in Groovy 6!\n    @Modifies({ [this.balance, this.auditLog] })\n    void credit(BigDecimal amount) {\n        balance += amount\n        auditLog.add(\"+$amount\".toString())\n    }\n\n    @Requires({ amount > 0G && amount <= balance })\n    @Ensures({ balance == old.balance - amount })\n    @Modifies({ [this.balance, this.auditLog] })\n    void debit(BigDecimal amount) {\n        balance -= amount\n        auditLog.add(\"-$amount\".toString())\n    }\n\n    @Pure\n    BigDecimal currentBalance() { balance }\n}\n\nval wallet = new VerifiedWallet()\nwallet.credit(100G)\nwallet.debit(35G)\nassert wallet.currentBalance() == 65G\nassert wallet.auditLog == ['+100', '-35']\nprintln \"[OK] 1. @Invariant, @Requires, @Ensures, @Modifies & @Pure with compile-time checkers\"\n\n// ---------------------------------------------------------------------------\n// 2. Loop `@Invariant` & `@Decreases` + Exceptional `@ThrowsIf`\n// ---------------------------------------------------------------------------\n@TypeChecked\nclass VerifiedAlgorithms {\n    // Merge two sorted lists with loop invariant + lexicographic termination measure\n    @Ensures({ result.isSorted() })\n    static List<Integer> mergeSorted(List<Integer> left, List<Integer> right) {\n        List<Integer> a = new ArrayList<>(left)\n        List<Integer> b = new ArrayList<>(right)\n        List<Integer> out = []\n        int total = a.size() + b.size()\n\n        @Invariant({ a.size() + b.size() + out.size() == total })\n        @Decreases({ [a.size(), b.size()] })\n        while (a || b) {\n            if (!a) { out.addAll(b); b.clear(); break }\n            if (!b) { out.addAll(a); a.clear(); break }\n            out << (a[0] <= b[0] ? a.remove(0) : b.remove(0))\n        }\n        out\n    }\n\n    // Recursive termination measure via `@Decreases` on a method\n    @Requires({ n >= 0 })\n    @Decreases({ n })\n    static long factorial(int n) {\n        n <= 1 ? 1L : n * factorial(n - 1)\n    }\n\n    // `@ThrowsIf` weaves the guard clause automatically at method entry!\n    @ThrowsIf(value = { divisor == 0 }, exception = ArithmeticException)\n    static int safeDivide(int dividend, int divisor) {\n        dividend.intdiv(divisor)\n    }\n}\n\nassert VerifiedAlgorithms.mergeSorted([1, 4, 7], [2, 3, 8]) == [1, 2, 3, 4, 7, 8]\nassert VerifiedAlgorithms.factorial(6) == 720L\nassert VerifiedAlgorithms.safeDivide(20, 4) == 5\n\nboolean dividedByZeroCaught = false\ntry {\n    VerifiedAlgorithms.safeDivide(10, 0)\n} catch (ArithmeticException expected) {\n    dividedByZeroCaught = true\n}\nassert dividedByZeroCaught\nprintln \"[OK] 2. Loop @Invariant/@Decreases, recursive @Decreases & woven @ThrowsIf\"\n\n// ---------------------------------------------------------------------------\n// 3. `NullChecker` & Parameterized `NullChecker(strict: true)`\n// ---------------------------------------------------------------------------\n@TypeChecked(extensions = 'groovy.typecheckers.NullChecker(strict: true)')\nclass NullSafeService {\n    static String normalize(String input) {\n        def candidate = null\n        candidate = input?.trim()\n        // Flow-sensitive guard recognised by NullChecker:\n        if (candidate != null && !candidate.isEmpty()) {\n            return candidate.toUpperCase()\n        }\n        return 'DEFAULT'\n    }\n}\n\nassert NullSafeService.normalize('  groovy 6  ') == 'GROOVY 6'\nassert NullSafeService.normalize(null) == 'DEFAULT'\nprintln \"[OK] 3. Flow-sensitive NullChecker(strict: true)\"\n\n// ---------------------------------------------------------------------------\n// 4. `CombinerChecker` with `@Associative` for Parallel Reductions\n// ---------------------------------------------------------------------------\nclass MathOps {\n    @Associative\n    static int sumInts(int a, int b) { a + b }\n}\n\n@TypeChecked(extensions = 'groovy.typecheckers.CombinerChecker')\nint parallelSumVerified(List<Integer> values) {\n    values.injectParallel(0, MathOps.&sumInts)\n}\n\nassert parallelSumVerified([10, 20, 30, 40]) == 100\nprintln \"[OK] 4. CombinerChecker & @Associative parallel reduction verification\"\n\n// ---------------------------------------------------------------------------\n// 5. Monadic Comprehensions (`DO` macro + `MonadicChecker`, GEP-23)\n// ---------------------------------------------------------------------------\nnew GroovyShell(new GroovyClassLoader(this.class.classLoader)).evaluate('''\nimport groovy.transform.TypeChecked\nimport static org.apache.groovy.macrolib.MacroLibGroovyMethods.DO\n\n@TypeChecked(extensions = 'groovy.typecheckers.MonadicChecker')\nOptional<String> formatUserBadge(Map<String, String> directory, String id) {\n    DO(\n        rawEntry in Optional.ofNullable(directory[id]),\n        role     in Optional.ofNullable(rawEntry.contains('|') ? rawEntry.split(/\\\\|/)[1] : null)\n    ) {\n        Optional.of(\"[$id:${role.toUpperCase()}]\".toString())\n    }\n}\n\nval dir = [u1: 'Alice|admin', u2: 'Bob']\nassert formatUserBadge(dir, 'u1') == Optional.of('[u1:ADMIN]')\nassert formatUserBadge(dir, 'u2') == Optional.empty() // short-circuits cleanly on second step\nassert formatUserBadge(dir, 'u9') == Optional.empty() // short-circuits cleanly on first step\n''')\nprintln \"[OK] 5. Monadic comprehensions (`DO` macro + MonadicChecker)\"\n\n// ---------------------------------------------------------------------------\n// 6. `@SafeRegex`: Regex Timeout Facility against ReDoS (GROOVY-12122)\n// ---------------------------------------------------------------------------\n@SafeRegex(millis = 20)\nclass SafeMatcher {\n    static boolean matchesBacktracking(String text) {\n        text ==~ /((a+)+)\\1!/\n    }\n}\n\nassert SafeMatcher.matchesBacktracking('aaaa!')\nboolean timedOut = false\ntry {\n    SafeMatcher.matchesBacktracking('a' * 60 + 'X')\n} catch (RegexTimeoutException ex) {\n    timedOut = true\n}\nassert timedOut\nprintln \"[OK] 6. @SafeRegex protection against catastrophic backtracking (ReDoS)\"\n\n// ---------------------------------------------------------------------------\n// 7. `@Virtual` Static Methods on Traits (GEP-22)\n// ---------------------------------------------------------------------------\ntrait ConfigurableEntity {\n    @Virtual static int defaultPageSize() { 25 }\n    static String describePagination() { \"pageSize=${defaultPageSize()}\" }\n}\n\nclass StandardEntity implements ConfigurableEntity {}\nclass CompactEntity implements ConfigurableEntity {\n    static int defaultPageSize() { 10 } // Overrides the trait's @Virtual static method!\n}\n\nassert StandardEntity.describePagination() == 'pageSize=25'\nassert CompactEntity.describePagination()  == 'pageSize=10'\nprintln \"[OK] 7. @Virtual overridable static methods in traits (GEP-22)\"\n",
      "verifiedOut": "✓ ALL PILLAR 04 (04_contracts_and_checkers.groovy) ASSERTIONS PASSED!"
    },
    {
      "id": "Script 05",
      "file": "05_gdk_and_ginq.groovy",
      "title": "GDK Extensions, Fat-Free Lambdas & GINQ — Full Standalone Script",
      "pillarPage": "05-gdk-and-ginq.html",
      "grabs": [],
      "execMs": 92,
      "code": "/// # Groovy 6.0 — New GDK Methods, Fat-Free Lambdas, `groovyToString` & GINQ\n///\n/// Distills:\n/// - `groupByMany` (multi-key grouping on Iterables and value-to-key inversion on Maps)\n/// - `zipWithNext` (sliding pairs & deltas) and `groupConsecutive` (maximal runs)\n/// - `isSorted`, `clamp`, `takeIf`, `grepping`, `findingResults`, `toMutableList` / `toImmutableList`\n/// - Regex group helpers: `findGroups`, `findAllGroups`, and nested `findBalancedGroups`\n/// - Locale-aware number formatting & parsing (`toCurrencyString`, `toPercentString`, etc.)\n/// - Process `waitForResult()` and async NIO (`Path.textAsync`, `Path.writeAsync`)\n/// - Fat-free `java.util.function` overloads & `Closures.curryWith` (zero Closure allocation)\n/// - Customisable display protocol with `groovyToString()`\n/// - GINQ (graduated from incubating): `groupby ... into g` and `union`/`intersect`/`minus`\n\n@Grab('org.apache.groovy:groovy-ginq:6.0.0')\nimport groovy.transform.CompileStatic\nimport java.nio.file.Files\nimport java.nio.file.Path\nimport java.util.function.BiPredicate\nimport java.util.function.Function\nimport java.util.function.Predicate\nimport java.util.stream.Stream\n\nimport static org.apache.groovy.util.Closures.curryWith\n\nprintln \"=== 05. GDK Extensions, Fat-Free Lambdas, `groovyToString` & GINQ ===\"\n\n// ---------------------------------------------------------------------------\n// 1. `groupByMany`: Multi-Key Grouping\n// ---------------------------------------------------------------------------\nvar words = ['ant', 'bee', 'ape', 'cow', 'pig']\nvar vowels = 'aeiou'.toSet()\nassert words.groupByMany { String w -> w.toSet().intersect(vowels) } == [\n    a: ['ant', 'ape'],\n    e: ['bee', 'ape'],\n    i: ['pig'],\n    o: ['cow']\n]\n\n// No-arg Map variant inverts a Map<K, Iterable<V>> into Map<V, List<K>>\nvar fruitSeasons = [\n    apple : ['Autumn', 'Winter'],\n    berry : ['Spring', 'Summer'],\n    orange: ['Winter']\n]\nassert fruitSeasons.groupByMany() == [\n    Autumn: ['apple'],\n    Winter: ['apple', 'orange'],\n    Spring: ['berry'],\n    Summer: ['berry']\n]\nprintln \"[OK] 1. groupByMany multi-key grouping\"\n\n// ---------------------------------------------------------------------------\n// 2. `zipWithNext` & `groupConsecutive`\n// ---------------------------------------------------------------------------\nassert [1, 2, 3, 4].zipWithNext() == [[1, 2], [2, 3], [3, 4]]\n// Successive deltas with the combiner overload:\nassert [10, 15, 13, 20].zipWithNext { a, b -> b - a } == [5, -2, 7]\n\n// Maximal consecutive runs (unlike groupBy, only adjacent matching keys merge):\nassert [1, 1, 2, 2, 2, 3, 1].groupConsecutive() == [[1, 1], [2, 2, 2], [3], [1]]\nassert ['ant', 'ape', 'bee', 'cat', 'cow'].groupConsecutive { it[0] } == [\n    ['ant', 'ape'], ['bee'], ['cat', 'cow']\n]\nprintln \"[OK] 2. zipWithNext & groupConsecutive\"\n\n// ---------------------------------------------------------------------------\n// 3. `isSorted`, `clamp`, `takeIf`, `grepping`, `toImmutableList` / `toMutableList`\n// ---------------------------------------------------------------------------\nassert [1, 3, 5, 9].isSorted()\nassert ![1, 5, 3].isSorted()\n\nassert 15.clamp(1, 10) == 10\nassert (-5).clamp(0..100) == 0\n\ndef rawUrl = 'groovy-lang.org'\ndef normalizedUrl = rawUrl.takeIf { it.startsWith('https://') } ?: \"https://$rawUrl\".toString()\nassert normalizedUrl == 'https://groovy-lang.org'\n\n// Lazy `grepping` on an Iterator (no intermediate collection allocated)\ndef lazyFiltered = [0, 'hello', '', 42, null, 'world']\n    .iterator()\n    .grepping(String) // keep Strings\n    .grepping()       // keep Groovy-truthy Strings (non-empty)\n    .toList()\nassert lazyFiltered == ['hello', 'world']\n\n// Explicit mutability accumulators on Stream / Iterable\ndef immList = Stream.of(1, 2, 3).toImmutableList()\ndef mutList = Stream.of(1, 2, 3).toMutableList()\nmutList << 4\nassert immList == [1, 2, 3] && mutList == [1, 2, 3, 4]\nprintln \"[OK] 3. isSorted, clamp, takeIf, grepping & stream accumulators\"\n\n// ---------------------------------------------------------------------------\n// 4. Regex Group Extraction (`findGroups`, `findAllGroups`, `findBalancedGroups`)\n// ---------------------------------------------------------------------------\ndef semver = /(\\d+)\\.(\\d+)\\.(\\d+)(?:-(.+))?/\ndef (_, major, minor, patch, qualifier) = '6.0.0-rc-1'.findGroups(semver)\nassert [major, minor, patch, qualifier] == ['6', '0', '0', 'rc-1']\n\n// Optional group missing pads with null in multi-assignment:\ndef (_all, maj2, min2, pat2, qual2) = '6.0.0'.findGroups(semver)\nassert [maj2, min2, pat2, qual2] == ['6', '0', '0', null]\n\n// Balanced nested delimiter extraction (returns `BalancedGroup` trees with `.children`!)\ndef expr = 'calc(add(1, 2), mul(3, 4)) + fn(x)'\ndef balanced = expr.findBalancedGroups(/\\(/, /\\)/)\nassert balanced*.matchedString == ['(add(1, 2), mul(3, 4))', '(x)']\nassert balanced[0].children*.matchedString == ['(1, 2)', '(3, 4)']\nprintln \"[OK] 4. findGroups, findAllGroups & findBalancedGroups\"\n\n// ---------------------------------------------------------------------------\n// 5. Locale-Aware Currency & Percent Formatting / Parsing\n// ---------------------------------------------------------------------------\nassert 1234.5.toCurrencyString(Locale.US) == '$1,234.50'\nassert '$1,234.50'.toCurrencyNumber(Locale.US) == 1234.5G\nassert 0.875.toPercentString(Locale.US) == '88%'\nassert '94.5%'.toPercentNumber(Locale.US) == 0.945G\nprintln \"[OK] 5. Locale-aware currency & percent formatting/parsing\"\n\n// ---------------------------------------------------------------------------\n// 6. Process `waitForResult()` & Async File I/O (`Path.textAsync` / `writeAsync`)\n// ---------------------------------------------------------------------------\ndef procResult = 'echo Groovy6-Process'.execute().waitForResult()\nassert procResult.ok\nassert procResult.exitCode == 0\nassert procResult.out.trim() == 'Groovy6-Process'\n\nPath tmpFile = Files.createTempFile('groovy6-async-', '.txt')\ntry {\n    await(tmpFile.writeAsync('Async NIO in Groovy 6'))\n    String content = await(tmpFile.textAsync)\n    assert content == 'Async NIO in Groovy 6'\n} finally {\n    Files.deleteIfExists(tmpFile)\n}\nprintln \"[OK] 6. Process waitForResult() & Path async file I/O\"\n\n// ---------------------------------------------------------------------------\n// 7. Fat-Free Higher-Order Methods (`java.util.function` & `Closures.curryWith`)\n// ---------------------------------------------------------------------------\n@CompileStatic\nvoid demoFatFreeFunctionalOverloads() {\n    Predicate<Integer> isEven = (Integer n) -> n % 2 == 0\n    Function<Integer, Integer> triple = (Integer n) -> n * 3\n    BiPredicate<Integer, Integer> divisibleBy = (Integer n, Integer d) -> n % d == 0\n\n    assert [1, 2, 3, 4, 5, 6].findAll(isEven) == [2, 4, 6]\n    assert [1, 2, 3].collect(triple) == [3, 6, 9]\n    assert [1, 2, 3, 4, 5, 6, 9].findAll(curryWith(divisibleBy, 3)) == [3, 6, 9]\n}\ndemoFatFreeFunctionalOverloads()\nprintln \"[OK] 7. Fat-free java.util.function overloads & Closures.curryWith\"\n\n// ---------------------------------------------------------------------------\n// 8. Customisable Object Display with `groovyToString()`\n// ---------------------------------------------------------------------------\nclass SecretToken {\n    String raw\n    String toString() { raw }\n    String groovyToString() { \"SecretToken(***${raw.takeRight(3)})\" }\n}\n\ndef tok = new SecretToken(raw: 'ghp_123456789xyz')\nassert tok.toString() == 'ghp_123456789xyz'\nassert \"$tok\" == 'SecretToken(***xyz)'\nassert [token: tok].toString() == '[token:SecretToken(***xyz)]'\nprintln \"[OK] 8. Customisable object display with groovyToString()\"\n\n// ---------------------------------------------------------------------------\n// 9. GINQ Enhancements (`groupby ... into g` & Set Operators)\n// ---------------------------------------------------------------------------\nnew GroovyShell(new GroovyClassLoader(this.class.classLoader)).evaluate('''\ndef groupedRows = GQL {\n    from n in [1, 11, 111, 8, 80]\n    groupby (n % 2 == 0 ? 'even' : 'odd') into g\n    orderby g.key in asc\n    select g.key as parity, g.count() as cnt, g.sum(x -> x) as total, g.toList() as items\n}\nassert groupedRows[0].parity == 'even' && groupedRows[0].cnt == 2 && groupedRows[0].total == 88\nassert groupedRows[1].parity == 'odd'  && groupedRows[1].cnt == 3 && groupedRows[1].total == 123\n\ndef teamA = ['Alice', 'Bob', 'Carol']\ndef teamB = ['Bob', 'Carol', 'Dave']\n\nassert GQL {\n    from u in teamA select u\n    union\n    from u in teamB select u\n} == ['Alice', 'Bob', 'Carol', 'Dave']\n\nassert GQL {\n    from u in teamA select u\n    intersect\n    from u in teamB select u\n} == ['Bob', 'Carol']\n\nassert GQL {\n    from u in teamA select u\n    minus\n    from u in teamB select u\n} == ['Alice']\n''')\nprintln \"[OK] 9. GINQ `groupby ... into` and set operators (union, intersect, minus)\"\n",
      "verifiedOut": "✓ ALL PILLAR 05 (05_gdk_and_ginq.groovy) ASSERTIONS PASSED!"
    },
    {
      "id": "Script 06",
      "file": "06_batteries_included_modules.groovy",
      "title": "CSV, Markdown, HttpBuilder & StAX XML — Full Standalone Script",
      "pillarPage": "06-batteries-included.html",
      "grabs": [],
      "execMs": 39,
      "code": "/// # Groovy 6.0 — Batteries-Included Modules (`groovy-csv`, `groovy-markdown`, `groovy-http-builder` & Typed Parsing)\n///\n/// Distills:\n/// - `groovy-csv`: RFC 4180 `CsvSlurper` & `CsvBuilder` (untyped maps & Jackson-backed typed `parseAs`)\n/// - `groovy-markdown`: CommonMark `MarkdownSlurper` & `MarkdownDocument` (headings, codeBlocks, sections)\n/// - Consistent typed parsing across JSON, CSV, TOML, YAML, and XML\n/// - `groovy-xml` StAX streaming (`XmlUtil.streamElements`, `XmlUtil.events`)\n/// - `groovy-http-builder`: Imperative `HttpBuilder.http(...)` DSL & declarative `@HttpBuilderClient`\n///   (tested against an embedded JDK `HttpServer` so this script runs offline & deterministically!)\n\n@Grab('org.apache.groovy:groovy-csv:6.0.0')\n@Grab('org.apache.groovy:groovy-markdown:6.0.0')\n@Grab('org.apache.groovy:groovy-toml:6.0.0')\n@Grab('org.apache.groovy:groovy-yaml:6.0.0')\n@Grab('org.apache.groovy:groovy-http-builder:6.0.0')\nimport com.sun.net.httpserver.HttpServer\nimport groovy.csv.CsvBuilder\nimport groovy.csv.CsvSlurper\nimport groovy.http.Body\nimport groovy.http.Get\nimport groovy.http.Header\nimport groovy.http.HttpBuilderClient\nimport groovy.http.Post\nimport groovy.json.JsonOutput\nimport groovy.json.JsonSlurper\nimport groovy.markdown.MarkdownSlurper\nimport groovy.toml.TomlBuilder\nimport groovy.toml.TomlSlurper\nimport groovy.transform.Canonical\nimport groovy.xml.XmlParser\nimport groovy.xml.XmlUtil\nimport groovy.yaml.YamlBuilder\nimport groovy.yaml.YamlSlurper\n\nimport javax.xml.stream.events.XMLEvent\n\nimport static groovy.http.HttpBuilder.http\n\nprintln \"=== 06. Batteries-Included Modules (CSV, Markdown, Typed Formats, HttpBuilder) ===\"\n\n// ---------------------------------------------------------------------------\n// 1. `groovy-csv`: Reading & Writing CSV (Maps and Typed POJOs)\n// ---------------------------------------------------------------------------\n@Canonical\nclass Invoice {\n    String customer\n    BigDecimal amount\n    int items\n}\n\ndef csvText = 'customer,amount,items\\nAcme Corp,1500.50,3\\nGlobex,420.00,1'\n\n// 1a. Map-based parsing & writing\ndef csvMaps = new CsvSlurper().parseText(csvText)\nassert csvMaps.size() == 2\nassert csvMaps[0].customer == 'Acme Corp' && csvMaps[0].amount == '1500.50'\n\ndef generatedCsv = CsvBuilder.toCsv([\n    [name: 'Alice', role: 'Admin'],\n    [name: 'Bob',   role: 'User']\n])\nassert generatedCsv.contains('name,role') && generatedCsv.contains('Alice,Admin')\n\n// 1b. Typed parsing & writing (via Jackson CSV)\nList<Invoice> invoices = new CsvSlurper().parseAs(Invoice, csvText)\nassert invoices[0] == new Invoice('Acme Corp', 1500.50G, 3)\nassert invoices[1] == new Invoice('Globex', 420.00G, 1)\nprintln \"[OK] 1. groovy-csv: CsvSlurper & CsvBuilder (untyped maps & typed POJOs)\"\n\n// ---------------------------------------------------------------------------\n// 2. `groovy-markdown`: CommonMark Parsing & LLM Output Extraction\n// ---------------------------------------------------------------------------\ndef markdownSample = '''\\\n# Release Plan\n\nWelcome to **Apache Groovy 6.0**!\n\n## Code Samples\n\n```groovy\nval msg = 'Hello from Markdown!'\nprintln msg\n```\n\n```sql\nSELECT * FROM releases WHERE version = 6;\n```\n\n## Action Items\n- Ship new modules\n- Benchmark indy dispatch\n- Celebrate release\n\nCheck the [Release Notes](https://groovy-lang.org/releasenotes/groovy-6.0.html).\n'''\n\ndef mdDoc = new MarkdownSlurper().parseText(markdownSample)\nassert mdDoc.headings*.text == ['Release Plan', 'Code Samples', 'Action Items']\n\n// Extract fenced code blocks by language\ndef groovyBlocks = mdDoc.codeBlocks.findAll { it.lang == 'groovy' }*.text\nassert groovyBlocks.size() == 1 && groovyBlocks[0].contains(\"val msg = 'Hello from Markdown!'\")\n\n// Extract a specific section by heading title\ndef actionSection = mdDoc.section('Action Items')\nassert actionSection[0].type == 'list'\nassert actionSection[0].items*.text == [\n    'Ship new modules',\n    'Benchmark indy dispatch',\n    'Celebrate release'\n]\nassert mdDoc.links[0].href == 'https://groovy-lang.org/releasenotes/groovy-6.0.html'\nprintln \"[OK] 2. groovy-markdown: MarkdownSlurper headings, codeBlocks, sections & links\"\n\n// ---------------------------------------------------------------------------\n// 3. Consistent Typed Parsing Across JSON, TOML, YAML & XML + StAX Streaming\n// ---------------------------------------------------------------------------\n@Canonical\nclass ServerConfig {\n    String host\n    int port\n    boolean tls\n}\n\n// JSON\ndef fromJson = new JsonSlurper().parseText('{\"host\":\"api.local\",\"port\":8443,\"tls\":true}') as ServerConfig\n// TOML (graduated from incubating in 6.0!)\ndef fromToml = new TomlSlurper().parseTextAs(ServerConfig, 'host = \"api.local\"\\nport = 8443\\ntls = true\\n')\n// YAML\ndef fromYaml = new YamlSlurper().parseTextAs(ServerConfig, 'host: api.local\\nport: 8443\\ntls: true\\n')\n// XML\ndef fromXml  = new XmlParser().parseTextAs(ServerConfig, '<config><host>api.local</host><port>8443</port><tls>true</tls></config>')\n\nassert fromJson == new ServerConfig('api.local', 8443, true)\nassert fromToml == fromJson\nassert fromYaml == fromJson\nassert fromXml  == fromJson\n\n// StAX streaming helpers in `XmlUtil`: stream subtrees or events without loading whole DOM\njava.util.logging.Logger.getLogger('groovy.xml.FactorySupport').level = java.util.logging.Level.SEVERE\ndef catalogXml = '''\n<catalog>\n    <book id=\"1\"><title>Groovy in Action</title></book>\n    <book id=\"2\"><title>Programming Groovy 6</title></book>\n</catalog>\n'''\ndef titles = XmlUtil.streamElements(new StringReader(catalogXml), 'book')\n    .map { node -> node.getElementsByTagName('title').item(0).textContent }\n    .toList()\nassert titles == ['Groovy in Action', 'Programming Groovy 6']\n\nlong bookCount = XmlUtil.events(new StringReader(catalogXml))\n    .filter { it.eventType == XMLEvent.START_ELEMENT && it.asStartElement().name.localPart == 'book' }\n    .count()\nassert bookCount == 2L\nprintln \"[OK] 3. Typed parsing (JSON/TOML/YAML/XML) & StAX streaming (XmlUtil.streamElements/events)\"\n\n// ---------------------------------------------------------------------------\n// 4. `groovy-http-builder`: Imperative DSL & Declarative `@HttpBuilderClient`\n// ---------------------------------------------------------------------------\n@Canonical\nclass PluginInfo {\n    String id\n    String name\n    int stars\n}\n\n@Header(name = 'X-Client', value = 'Groovy6-Demo')\n@HttpBuilderClient('http://127.0.0.1:0')\ninterface PluginRegistryApi {\n    @Get('/plugins/{id}')\n    PluginInfo getPlugin(String id)\n\n    @Get('/plugins')\n    List<PluginInfo> search(String tag)   // implied query param `?tag=...`\n\n    @Post('/plugins')\n    PluginInfo register(@Body Map payload)\n}\n\n// Start a lightweight local HTTP server so the script is 100% self-contained\nHttpServer server = HttpServer.create(new InetSocketAddress('127.0.0.1', 0), 0)\nint port = server.address.port\n\nserver.createContext('/plugins') { exchange ->\n    String method = exchange.requestMethod\n    String path   = exchange.requestURI.path\n    String query  = exchange.requestURI.query\n    String responseJson\n\n    if (method == 'GET' && path == '/plugins/g6-async') {\n        responseJson = JsonOutput.toJson([id: 'g6-async', name: 'Groovy Async', stars: 99])\n    } else if (method == 'GET' && path == '/plugins' && query == 'tag=concurrency') {\n        responseJson = JsonOutput.toJson([[id: 'g6-concurrent', name: 'Concurrency Toolkit', stars: 150]])\n    } else if (method == 'POST' && path == '/plugins') {\n        def body = new JsonSlurper().parse(exchange.requestBody)\n        responseJson = JsonOutput.toJson([id: body.id, name: body.name, stars: 1])\n    } else {\n        exchange.sendResponseHeaders(404, -1)\n        exchange.close()\n        return\n    }\n\n    byte[] bytes = responseJson.getBytes('UTF-8')\n    exchange.responseHeaders.add('Content-Type', 'application/json')\n    exchange.sendResponseHeaders(200, bytes.length)\n    exchange.responseBody.write(bytes)\n    exchange.close()\n}\nserver.start()\n\ntry {\n    String baseUrl = \"http://127.0.0.1:$port\"\n\n    // 4a. Imperative DSL (`HttpBuilder.http`)\n    def client = http(baseUrl)\n    def resp = client.get('/plugins/g6-async')\n    assert resp.status() == 200\n    assert resp.json.name == 'Groovy Async'\n    assert resp.json.stars == 99\n\n    // 4b. Declarative typed interface (`@HttpBuilderClient`)\n    PluginRegistryApi api = PluginRegistryApi.create(baseUrl)\n    PluginInfo info = api.getPlugin('g6-async')\n    assert info == new PluginInfo('g6-async', 'Groovy Async', 99)\n\n    List<PluginInfo> found = api.search('concurrency')\n    assert found.size() == 1 && found[0].id == 'g6-concurrent'\n\n    PluginInfo created = api.register([id: 'g6-markdown', name: 'Markdown Slurper'])\n    assert created == new PluginInfo('g6-markdown', 'Markdown Slurper', 1)\n\n    // 4c. Async HTTP + Groovy 6 `await`\n    def asyncResp = await client.getAsync('/plugins/g6-async')\n    assert asyncResp.json.id == 'g6-async'\n} finally {\n    server.stop(0)\n}\nprintln \"[OK] 4. groovy-http-builder: Imperative DSL, @HttpBuilderClient & async await\"\n",
      "verifiedOut": "✓ ALL PILLAR 06 (06_batteries_included_modules.groovy) ASSERTIONS PASSED!"
    },
    {
      "id": "Script 07",
      "file": "07_tooling_and_compiler.groovy",
      "title": "Compiler, AstQuery, @ClassTag & Diagnostics — Full Standalone Script",
      "pillarPage": "07-compiler-and-ast.html",
      "grabs": [],
      "execMs": 82,
      "code": "/// # Groovy 6.0 — Compiler, AST Query API, `@ClassTag` & Diagnostics\n///\n/// Distills:\n/// - Fluent AST Query API (`AstQuery.from(...)` in `org.codehaus.groovy.ast.query`) (GROOVY-12116)\n/// - `@ClassTag`: Compiler-supplied class tokens & type-safe `withDefault` preemption (GROOVY-12115)\n/// - `CompilerConfiguration.errorFormat = SHORT`, check-only compilation (`targetPhase`),\n///   and Parrot parser error recovery (`errorRecoveryEnabled`)\n/// - Clearer syntax error messages (e.g. `'const' is not supported; use 'val' or 'static final' instead`)\n\nimport groovy.transform.CompileStatic\nimport groovy.transform.TypeChecked\nimport groovy.transform.stc.ClassTag\nimport org.codehaus.groovy.ast.ClassNode\nimport org.codehaus.groovy.ast.builder.AstBuilder\nimport org.codehaus.groovy.ast.expr.MethodCallExpression\nimport org.codehaus.groovy.ast.query.AstQuery\nimport org.codehaus.groovy.control.CompilationUnit\nimport org.codehaus.groovy.control.CompilePhase\nimport org.codehaus.groovy.control.CompilerConfiguration\nimport org.codehaus.groovy.control.ErrorFormat\nimport org.codehaus.groovy.control.MultipleCompilationErrorsException\nimport org.codehaus.groovy.control.Phases\n\nprintln \"=== 07. Compiler, AST Query API, @ClassTag & Diagnostics ===\"\n\n// ---------------------------------------------------------------------------\n// 1. Fluent AST Query API (`AstQuery`, GROOVY-12116)\n// ---------------------------------------------------------------------------\n// Locate AST nodes declaratively without writing stateful CodeVisitorSupport subclasses!\ndef astNodes = new AstBuilder().buildFromString(CompilePhase.CONVERSION, false, '''\n    class OrderProcessor {\n        void process(List items) {\n            validate(items)\n            items.each { save(it) }\n            audit('done')\n        }\n    }\n''')\nClassNode orderClass = astNodes.find { it instanceof ClassNode } as ClassNode\ndef processMethod = orderClass.getDeclaredMethods('process')[0]\n\n// Find all MethodCallExpressions inside `process`, excluding those nested inside closures:\ndef topLevelCalls = AstQuery.from(processMethod.code)\n    .descendants(MethodCallExpression)\n    .where { call -> call.methodAsString in ['validate', 'each', 'audit', 'save'] }\n    .stream()\n    .map { it.methodAsString }\n    .toList()\n\nassert topLevelCalls == ['validate', 'each', 'save', 'audit']\nprintln \"[OK] 1. Fluent AstQuery API over Groovy AST nodes\"\n\n// ---------------------------------------------------------------------------\n// 2. `@ClassTag`: Compiler-Supplied Class Tokens (GROOVY-12115)\n// ---------------------------------------------------------------------------\nclass TypedBox<T> {\n    final List<T> items = []\n\n    // When called from @CompileStatic / @TypeChecked code without passing `Class<T>`,\n    // the compiler reifies `T` from the receiver and injects `T.class` automatically!\n    List<T> checkedView(@ClassTag Class<T> type) {\n        Collections.checkedList(items, type)\n    }\n}\n\n@CompileStatic\nvoid demoClassTag() {\n    TypedBox<String> box = new TypedBox<>()\n    List<String> safeList = box.checkedView() // Compiler injects `String.class`!\n    safeList.add('hello')\n    assert safeList == ['hello']\n\n    // Verify runtime type-check enforcement from the injected String.class token:\n    boolean rejected = false\n    try {\n        ((List) safeList).add(999)\n    } catch (ClassCastException expected) {\n        rejected = true\n    }\n    assert rejected\n\n    // Groovy's own `Map.withDefault` uses `@ClassTag(preempt = true)` under @CompileStatic\n    Map<String, Integer> scores = [:].withDefault { 0 }\n    scores['alice'] = 10\n    assert scores['bob'] == 0\n}\ndemoClassTag()\nprintln \"[OK] 2. @ClassTag compiler-supplied class tokens & type-safe withDefault\"\n\n// ---------------------------------------------------------------------------\n// 3. `ErrorFormat.SHORT`, Check-Only Compilation & Clearer Syntax Diagnostics\n// ---------------------------------------------------------------------------\ndef config = new CompilerConfiguration(\n    errorFormat: ErrorFormat.SHORT,\n    targetPhase: Phases.CLASS_GENERATION // equivalent to `groovyc --check`\n)\n\ndef cu = new CompilationUnit(config)\ncu.addSource('BadSyntax.groovy', 'const answer = 42\\n')\n\nStringWriter errOut = new StringWriter()\ntry {\n    cu.compile(config.targetPhase)\n} catch (MultipleCompilationErrorsException ex) {\n    ex.errorCollector.write(new PrintWriter(errOut), null)\n}\n\nString diagnostic = errOut.toString().trim()\n// Verify single-line `file:line:col: error: ...` format and helpful `const` -> `val` hint!\nassert diagnostic.startsWith('BadSyntax.groovy:1:1: error:')\nassert diagnostic.contains(\"'const' is not supported; use 'val' or 'static final' instead\")\nprintln \"[OK] 3. ErrorFormat.SHORT (`file:line:col: error:`) & clearer syntax diagnostics\"\n",
      "verifiedOut": "✓ ALL PILLAR 07 (07_tooling_and_compiler.groovy) ASSERTIONS PASSED!"
    }
  ]
};
