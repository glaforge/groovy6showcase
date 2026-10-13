/// # Groovy 6.0 — Batteries-Included Modules (`groovy-csv`, `groovy-markdown`, `groovy-http-builder` & Typed Parsing)
///
/// Distills:
/// - `groovy-csv`: RFC 4180 `CsvSlurper` & `CsvBuilder` (untyped maps & Jackson-backed typed `parseAs`)
/// - `groovy-markdown`: CommonMark `MarkdownSlurper` & `MarkdownDocument` (headings, codeBlocks, sections)
/// - Consistent typed parsing across JSON, CSV, TOML, YAML, and XML
/// - `groovy-xml` StAX streaming (`XmlUtil.streamElements`, `XmlUtil.events`)
/// - `groovy-http-builder`: Imperative `HttpBuilder.http(...)` DSL & declarative `@HttpBuilderClient`
///   (tested against an embedded JDK `HttpServer` so this script runs offline & deterministically!)

@Grab('org.apache.groovy:groovy-csv:6.0.0')
@Grab('org.apache.groovy:groovy-markdown:6.0.0')
@Grab('org.apache.groovy:groovy-toml:6.0.0')
@Grab('org.apache.groovy:groovy-yaml:6.0.0')
@Grab('org.apache.groovy:groovy-http-builder:6.0.0')
import com.sun.net.httpserver.HttpServer
import groovy.csv.CsvBuilder
import groovy.csv.CsvSlurper
import groovy.http.Body
import groovy.http.Get
import groovy.http.Header
import groovy.http.HttpBuilderClient
import groovy.http.Post
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import groovy.markdown.MarkdownSlurper
import groovy.toml.TomlBuilder
import groovy.toml.TomlSlurper
import groovy.transform.Canonical
import groovy.xml.XmlParser
import groovy.xml.XmlUtil
import groovy.yaml.YamlBuilder
import groovy.yaml.YamlSlurper

import javax.xml.stream.events.XMLEvent

import static groovy.http.HttpBuilder.http

println "=== 06. Batteries-Included Modules (CSV, Markdown, Typed Formats, HttpBuilder) ==="

// ---------------------------------------------------------------------------
// 1. `groovy-csv`: Reading & Writing CSV (Maps and Typed POJOs)
// ---------------------------------------------------------------------------
@Canonical
class Invoice {
    String customer
    BigDecimal amount
    int items
}

def csvText = 'customer,amount,items\nAcme Corp,1500.50,3\nGlobex,420.00,1'

// 1a. Map-based parsing & writing
def csvMaps = new CsvSlurper().parseText(csvText)
assert csvMaps.size() == 2
assert csvMaps[0].customer == 'Acme Corp' && csvMaps[0].amount == '1500.50'

def generatedCsv = CsvBuilder.toCsv([
    [name: 'Alice', role: 'Admin'],
    [name: 'Bob',   role: 'User']
])
assert generatedCsv.contains('name,role') && generatedCsv.contains('Alice,Admin')

// 1b. Typed parsing & writing (via Jackson CSV)
List<Invoice> invoices = new CsvSlurper().parseAs(Invoice, csvText)
assert invoices[0] == new Invoice('Acme Corp', 1500.50G, 3)
assert invoices[1] == new Invoice('Globex', 420.00G, 1)
println "[OK] 1. groovy-csv: CsvSlurper & CsvBuilder (untyped maps & typed POJOs)"

// ---------------------------------------------------------------------------
// 2. `groovy-markdown`: CommonMark Parsing & LLM Output Extraction
// ---------------------------------------------------------------------------
def markdownSample = '''\
# Release Plan

Welcome to **Apache Groovy 6.0**!

## Code Samples

```groovy
val msg = 'Hello from Markdown!'
println msg
```

```sql
SELECT * FROM releases WHERE version = 6;
```

## Action Items
- Ship new modules
- Benchmark indy dispatch
- Celebrate release

Check the [Release Notes](https://groovy-lang.org/releasenotes/groovy-6.0.html).
'''

def mdDoc = new MarkdownSlurper().parseText(markdownSample)
assert mdDoc.headings*.text == ['Release Plan', 'Code Samples', 'Action Items']

// Extract fenced code blocks by language
def groovyBlocks = mdDoc.codeBlocks.findAll { it.lang == 'groovy' }*.text
assert groovyBlocks.size() == 1 && groovyBlocks[0].contains("val msg = 'Hello from Markdown!'")

// Extract a specific section by heading title
def actionSection = mdDoc.section('Action Items')
assert actionSection[0].type == 'list'
assert actionSection[0].items*.text == [
    'Ship new modules',
    'Benchmark indy dispatch',
    'Celebrate release'
]
assert mdDoc.links[0].href == 'https://groovy-lang.org/releasenotes/groovy-6.0.html'
println "[OK] 2. groovy-markdown: MarkdownSlurper headings, codeBlocks, sections & links"

// ---------------------------------------------------------------------------
// 3. Consistent Typed Parsing Across JSON, TOML, YAML & XML + StAX Streaming
// ---------------------------------------------------------------------------
@Canonical
class ServerConfig {
    String host
    int port
    boolean tls
}

// JSON
def fromJson = new JsonSlurper().parseText('{"host":"api.local","port":8443,"tls":true}') as ServerConfig
// TOML (graduated from incubating in 6.0!)
def fromToml = new TomlSlurper().parseTextAs(ServerConfig, 'host = "api.local"\nport = 8443\ntls = true\n')
// YAML
def fromYaml = new YamlSlurper().parseTextAs(ServerConfig, 'host: api.local\nport: 8443\ntls: true\n')
// XML
def fromXml  = new XmlParser().parseTextAs(ServerConfig, '<config><host>api.local</host><port>8443</port><tls>true</tls></config>')

assert fromJson == new ServerConfig('api.local', 8443, true)
assert fromToml == fromJson
assert fromYaml == fromJson
assert fromXml  == fromJson

// StAX streaming helpers in `XmlUtil`: stream subtrees or events without loading whole DOM
java.util.logging.Logger.getLogger('groovy.xml.FactorySupport').level = java.util.logging.Level.SEVERE
def catalogXml = '''
<catalog>
    <book id="1"><title>Groovy in Action</title></book>
    <book id="2"><title>Programming Groovy 6</title></book>
</catalog>
'''
def titles = XmlUtil.streamElements(new StringReader(catalogXml), 'book')
    .map { node -> node.getElementsByTagName('title').item(0).textContent }
    .toList()
assert titles == ['Groovy in Action', 'Programming Groovy 6']

long bookCount = XmlUtil.events(new StringReader(catalogXml))
    .filter { it.eventType == XMLEvent.START_ELEMENT && it.asStartElement().name.localPart == 'book' }
    .count()
assert bookCount == 2L
println "[OK] 3. Typed parsing (JSON/TOML/YAML/XML) & StAX streaming (XmlUtil.streamElements/events)"

// ---------------------------------------------------------------------------
// 4. `groovy-http-builder`: Imperative DSL & Declarative `@HttpBuilderClient`
// ---------------------------------------------------------------------------
@Canonical
class PluginInfo {
    String id
    String name
    int stars
}

@Header(name = 'X-Client', value = 'Groovy6-Demo')
@HttpBuilderClient('http://127.0.0.1:0')
interface PluginRegistryApi {
    @Get('/plugins/{id}')
    PluginInfo getPlugin(String id)

    @Get('/plugins')
    List<PluginInfo> search(String tag)   // implied query param `?tag=...`

    @Post('/plugins')
    PluginInfo register(@Body Map payload)
}

// Start a lightweight local HTTP server so the script is 100% self-contained
HttpServer server = HttpServer.create(new InetSocketAddress('127.0.0.1', 0), 0)
int port = server.address.port

server.createContext('/plugins') { exchange ->
    String method = exchange.requestMethod
    String path   = exchange.requestURI.path
    String query  = exchange.requestURI.query
    String responseJson

    if (method == 'GET' && path == '/plugins/g6-async') {
        responseJson = JsonOutput.toJson([id: 'g6-async', name: 'Groovy Async', stars: 99])
    } else if (method == 'GET' && path == '/plugins' && query == 'tag=concurrency') {
        responseJson = JsonOutput.toJson([[id: 'g6-concurrent', name: 'Concurrency Toolkit', stars: 150]])
    } else if (method == 'POST' && path == '/plugins') {
        def body = new JsonSlurper().parse(exchange.requestBody)
        responseJson = JsonOutput.toJson([id: body.id, name: body.name, stars: 1])
    } else {
        exchange.sendResponseHeaders(404, -1)
        exchange.close()
        return
    }

    byte[] bytes = responseJson.getBytes('UTF-8')
    exchange.responseHeaders.add('Content-Type', 'application/json')
    exchange.sendResponseHeaders(200, bytes.length)
    exchange.responseBody.write(bytes)
    exchange.close()
}
server.start()

try {
    String baseUrl = "http://127.0.0.1:$port"

    // 4a. Imperative DSL (`HttpBuilder.http`)
    def client = http(baseUrl)
    def resp = client.get('/plugins/g6-async')
    assert resp.status() == 200
    assert resp.json.name == 'Groovy Async'
    assert resp.json.stars == 99

    // 4b. Declarative typed interface (`@HttpBuilderClient`)
    PluginRegistryApi api = PluginRegistryApi.create(baseUrl)
    PluginInfo info = api.getPlugin('g6-async')
    assert info == new PluginInfo('g6-async', 'Groovy Async', 99)

    List<PluginInfo> found = api.search('concurrency')
    assert found.size() == 1 && found[0].id == 'g6-concurrent'

    PluginInfo created = api.register([id: 'g6-markdown', name: 'Markdown Slurper'])
    assert created == new PluginInfo('g6-markdown', 'Markdown Slurper', 1)

    // 4c. Async HTTP + Groovy 6 `await`
    def asyncResp = await client.getAsync('/plugins/g6-async')
    assert asyncResp.json.id == 'g6-async'
} finally {
    server.stop(0)
}
println "[OK] 4. groovy-http-builder: Imperative DSL, @HttpBuilderClient & async await"
