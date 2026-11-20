document.addEventListener('DOMContentLoaded', function () {
  // --- 1. Live Glossary Search (Whole-Word Boundary) ---
  var glossarySearch = document.getElementById('glossarySearch');
  var glossaryNoResults = document.getElementById('glossaryNoResults');
  var glossaryAuto = document.getElementById('glossaryAuto');

  function filterGlossary() {
    if (!glossarySearch) return;
    var query = glossarySearch.value.trim();
    var cards = glossaryAuto.querySelectorAll('.term-card');
    var cats = glossaryAuto.querySelectorAll('.glossary-cat');
    var visibleCount = 0;

    if (!query) {
      cards.forEach(function (c) { c.classList.remove('hidden'); });
      cats.forEach(function (cat) { cat.classList.remove('hidden'); });
      if (glossaryNoResults) glossaryNoResults.classList.add('hidden');
      return;
    }

    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('\\b' + escaped, 'i');

    cards.forEach(function (card) {
      var match = regex.test(card.textContent);
      card.classList.toggle('hidden', !match);
      if (match) visibleCount++;
    });

    cats.forEach(function (cat) {
      var next = cat.nextElementSibling;
      var hasVisible = false;
      while (next && !next.classList.contains('glossary-cat')) {
        if (next.classList.contains('term-card') && !next.classList.contains('hidden')) {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      cat.classList.toggle('hidden', !hasVisible);
    });

    if (glossaryNoResults) {
      glossaryNoResults.classList.toggle('hidden', visibleCount > 0);
    }
  }

  if (glossarySearch) {
    glossarySearch.addEventListener('input', filterGlossary);
  }

  // --- 2. RESTCONF API Scenarios & Verb Responses ---
  var scenarios = {
    'int-ip': {
      uri: 'https://10.10.1',
      verbs: {
        GET: {
          status: '200 OK',
          err: false,
          explain: 'Reads the current configuration of Loopback10 using the vendor-neutral IETF YANG model.',
          req: '// No request body required for GET',
          res: '{\n  "ietf-interfaces:interface": {\n    "name": "Loopback10",\n    "type": "iana-if-type:softwareLoopback",\n    "enabled": true,\n    "ietf-ip:ipv4": {\n      "address": [{ "ip": "10.255.10.1", "netmask": "255.255.255.255" }]\n    }\n  }\n}'
        },
        POST: {
          status: '201 Created',
          err: false,
          explain: 'Creates a new interface list entry under /interfaces (URI targets parent container).',
          req: '{\n  "ietf-interfaces:interface": {\n    "name": "Loopback10",\n    "type": "iana-if-type:softwareLoopback",\n    "enabled": true\n  }\n}',
          res: '// 201 Created — Location: .../interface=Loopback10'
        },
        PUT: {
          status: '204 No Content',
          err: false,
          explain: 'Idempotently replaces the entire Loopback10 resource (any omitted optional fields reset to defaults).',
          req: '{\n  "ietf-interfaces:interface": {\n    "name": "Loopback10",\n    "type": "iana-if-type:softwareLoopback",\n    "enabled": true,\n    "ietf-ip:ipv4": {\n      "address": [{ "ip": "10.255.10.1", "netmask": "255.255.255.255" }]\n    }\n  }\n}',
          res: '// 204 No Content (Resource replaced cleanly)'
        },
        PATCH: {
          status: '204 No Content',
          err: false,
          explain: 'Partially merges/updates only the IPv4 address leaf without touching description or MTU.',
          req: '{\n  "ietf-interfaces:interface": {\n    "ietf-ip:ipv4": {\n      "address": [{ "ip": "10.255.10.1", "netmask": "255.255.255.255" }]\n    }\n  }\n}',
          res: '// 204 No Content (Partial merge applied)'
        },
        DELETE: {
          status: '204 No Content',
          err: false,
          explain: 'Removes Loopback10 from the running datastore.',
          req: '// No request body required for DELETE',
          res: '// 204 No Content (Interface deleted)'
        }
      }
    },
    'int-oper': {
      uri: 'https://10.10.1',
      verbs: {
        GET: {
          status: '200 OK',
          err: false,
          explain: 'Reads read-only operational telemetry (oper-status, MAC address, counters) from interfaces-state.',
          req: '// No request body required for GET',
          res: '{\n  "ietf-interfaces:interface": {\n    "name": "GigabitEthernet1",\n    "admin-status": "up",\n    "oper-status": "up",\n    "phys-address": "00:50:56:8a:11:22",\n    "speed": 1000000000\n  }\n}'
        },
        POST: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Operational state nodes (config false in YANG) are read-only and reject write methods.',
          req: '{ "oper-status": "down" }',
          res: '{\n  "ietf-restconf:errors": {\n    "error": [{ "error-tag": "operation-not-supported", "error-message": "Cannot modify config false state data" }]\n  }\n}'
        },
        PUT: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Operational state nodes (config false in YANG) are read-only.',
          req: '{ "oper-status": "down" }',
          res: '// 405 Method Not Allowed (Read-only operational datastore)'
        },
        PATCH: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Operational state nodes (config false in YANG) cannot be patched.',
          req: '{ "oper-status": "down" }',
          res: '// 405 Method Not Allowed (Read-only operational datastore)'
        },
        DELETE: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Physical hardware operational state cannot be deleted via RESTCONF.',
          req: '// No body',
          res: '// 405 Method Not Allowed'
        }
      }
    },
    'bgp-asn': {
      uri: 'https://10.10.1',
      verbs: {
        GET: {
          status: '200 OK',
          err: false,
          explain: 'Queries Cisco-IOS-XE-native YANG model for BGP AS 65001 configuration.',
          req: '// No request body required for GET',
          res: '{\n  "Cisco-IOS-XE-bgp:bgp": {\n    "id": 65001,\n    "bgp": { "router-id": { "ip-id": "1.1.1.1" } }\n  }\n}'
        },
        POST: {
          status: '409 Conflict',
          err: true,
          explain: 'BGP process 65001 already exists; POST cannot overwrite an existing keyed list instance.',
          req: '{ "Cisco-IOS-XE-bgp:bgp": { "id": 65001 } }',
          res: '// 409 Conflict — Resource already exists (Use PATCH or PUT)'
        },
        PUT: {
          status: '204 No Content',
          err: false,
          explain: 'Replaces the entire BGP 65001 configuration container.',
          req: '{\n  "Cisco-IOS-XE-bgp:bgp": {\n    "id": 65001,\n    "bgp": { "router-id": { "ip-id": "1.1.1.1" } }\n  }\n}',
          res: '// 204 No Content'
        },
        PATCH: {
          status: '204 No Content',
          err: false,
          explain: 'Updates only the BGP router-id leaf while keeping existing BGP neighbors untouched.',
          req: '{\n  "Cisco-IOS-XE-bgp:bgp": {\n    "id": 65001,\n    "bgp": { "router-id": { "ip-id": "10.0.0.1" } }\n  }\n}',
          res: '// 204 No Content (Router ID updated to 10.0.0.1)'
        },
        DELETE: {
          status: '204 No Content',
          err: false,
          explain: 'Executes "no router bgp 65001" on the IOS-XE device.',
          req: '// No body',
          res: '// 204 No Content (BGP process removed)'
        }
      }
    },
    'cat-health': {
      uri: 'https://catalyst-center.lab',
      verbs: {
        GET: {
          status: '200 OK',
          err: false,
          explain: 'Authenticates with X-Auth-Token header and retrieves AI-driven wireless/wired Client Health scores.',
          req: '// Headers: X-Auth-Token: <JWT_TOKEN>\n// Content-Type: application/json',
          res: '{\n  "response": [{\n    "siteId": "global",\n    "scoreDetail": [\n      { "scoreCategory": { "value": "ALL" }, "scoreValue": 96, "clientCount": 142 }\n    ]\n  }]\n}'
        },
        POST: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Assurance telemetry endpoints only support GET queries.',
          req: '{}',
          res: '// 405 Method Not Allowed'
        },
        PUT: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Assurance telemetry endpoints are read-only.',
          req: '{}',
          res: '// 405 Method Not Allowed'
        },
        PATCH: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Assurance telemetry endpoints are read-only.',
          req: '{}',
          res: '// 405 Method Not Allowed'
        },
        DELETE: {
          status: '405 Method Not Allowed',
          err: true,
          explain: 'Assurance telemetry endpoints are read-only.',
          req: '// No body',
          res: '// 405 Method Not Allowed'
        }
      }
    }
  };
  var scenarioSelect = document.getElementById('apiScenario');
  var currentVerb = 'PATCH';

  function renderRestconf() {
    var sc = scenarios[scenarioSelect.value];
    var data = sc.verbs[currentVerb];

    document.getElementById('reqUri').textContent = currentVerb + '  ' + sc.uri;
    document.getElementById('reqBody').textContent = data.req;

    var statusEl = document.getElementById('resStatus');
    statusEl.textContent = data.status;
    statusEl.classList.toggle('status-err', data.err);

    document.getElementById('resExplain').textContent = data.explain;
    document.getElementById('resBody').textContent = data.res;
  }

  document.querySelectorAll('.verb-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.verb-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentVerb = btn.getAttribute('data-verb');
      renderRestconf();
    });
  });

  scenarioSelect.addEventListener('change', renderRestconf);
  // --- 2B. Top Protocol Tab Switcher & NETCONF XML RPC Simulator ---
  var tabRestconf = document.getElementById('tabRestconf');
  var tabNetconf = document.getElementById('tabNetconf');
  var panelRestconf = document.getElementById('panelRestconf');
  var panelNetconf = document.getElementById('panelNetconf');

  var netconfRpcs = {
    'get-config': {
      explain: 'Retrieves ONLY configuration data from a specified datastore (<running>, <candidate>, or <startup>).',
      dsNote: 'Target Datastore: <running> | Returns XML wrapped in <rpc-reply><data>...',
      req: '<rpc message-id="101" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <get-config>\n    <source><running/></source>\n    <filter type="subtree">\n      <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces"/>\n    </filter>\n  </get-config>\n</rpc>]]>]]>',
      res: '<rpc-reply message-id="101" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <data>\n    <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">\n      <interface><name>Loopback10</name><enabled>true</enabled></interface>\n    </interfaces>\n  </data>\n</rpc-reply>]]>]]>'
    },
    'get': {
      explain: 'Retrieves BOTH configuration data AND read-only operational state (counters, link up/down) from <running>.',
      dsNote: 'Note: Unlike <get-config>, <get> takes no <source> tag because it always queries live operational state.',
      req: '<rpc message-id="102" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <get>\n    <filter type="subtree">\n      <interfaces-state xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces"/>\n    </filter>\n  </get>\n</rpc>]]>]]>',
      res: '<rpc-reply message-id="102" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <data>\n    <interfaces-state xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">\n      <interface><name>GigabitEthernet1</name><oper-status>up</oper-status></interface>\n    </interfaces-state>\n  </data>\n</rpc-reply>]]>]]>'
    },
    'edit-config': {
      explain: 'Creates, merges, replaces, or deletes configuration nodes inside <candidate> (or directly in <running>).',
      dsNote: 'Target Datastore: <candidate> | Staged safely until <commit> is sent (key advantage over RESTCONF).',
      req: '<rpc message-id="103" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <edit-config>\n    <target><candidate/></target>\n    <config>\n      <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">\n        <interface nc:operation="merge">\n          <name>Loopback10</name>\n          <description>ENCOR-NETCONF-LAB</description>\n        </interface>\n      </interfaces>\n    </config>\n  </edit-config>\n</rpc>]]>]]>',
      res: '<rpc-reply message-id="103" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <ok/>\n</rpc-reply>]]>]]>'
    },
    'commit': {
      explain: 'Atomically copies all staged changes from the <candidate> datastore into the active <running> configuration.',
      dsNote: 'Supports confirmed-commit (<confirmed/>) for automatic rollback if SSH connectivity is lost.',
      req: '<rpc message-id="104" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <commit/>\n</rpc>]]>]]>',
      res: '<rpc-reply message-id="104" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <ok/>\n</rpc-reply>]]>]]>'
    },
    'discard': {
      explain: 'Cancels all uncommitted edits in the <candidate> datastore, reverting it back to match <running>.',
      dsNote: 'Useful for aborting failed multi-device transactions cleanly.',
      req: '<rpc message-id="105" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <discard-changes/>\n</rpc>]]>]]>',
      res: '<rpc-reply message-id="105" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">\n  <ok/>\n</rpc-reply>]]>]]>'
    }
  };

  var ncSelect = document.getElementById('ncRpcSelect');
  function renderNetconf() {
    var item = netconfRpcs[ncSelect.value];
    document.getElementById('ncExplain').textContent = item.explain;
    document.getElementById('ncDatastoreNote').textContent = item.dsNote;
    document.getElementById('ncReqXml').textContent = item.req;
    document.getElementById('ncResXml').textContent = item.res;
  }
  ncSelect.addEventListener('change', renderNetconf);
  renderNetconf();

  // --- 2C. gRPC Telemetry & SOAP Simulator ---
  var tabGrpcSoap = document.getElementById('tabGrpcSoap');
  var panelGrpcSoap = document.getElementById('panelGrpcSoap');

  function activateProtocolTab(activeTab, activePanel) {
    [tabRestconf, tabNetconf, tabGrpcSoap].forEach(function (t) { t.classList.remove('active'); });
    [panelRestconf, panelNetconf, panelGrpcSoap].forEach(function (p) { p.classList.add('hidden'); });
    activeTab.classList.add('active');
    activePanel.classList.remove('hidden');
  }

  tabRestconf.addEventListener('click', function () { activateProtocolTab(tabRestconf, panelRestconf); });
  tabNetconf.addEventListener('click', function () { activateProtocolTab(tabNetconf, panelNetconf); });
  tabGrpcSoap.addEventListener('click', function () { activateProtocolTab(tabGrpcSoap, panelGrpcSoap); });

  var gsScenarios = {
    'grpc-dialout': {
      reqTitle: 'IOS-XE Model-Driven Telemetry Config (Dial-Out)',
      transport: 'gRPC / HTTP/2 | TCP 57400',
      encoding: 'GPB / KV-GPB (Binary)',
      explain: 'Router initiates an outbound HTTP/2 gRPC session to a collector and pushes YANG operational telemetry every 5 seconds—eliminating slow SNMP polling.',
      note: 'Binary Protocol Buffers (Protobuf) compress payloads up to 5–10x smaller than XML/JSON for high-frequency streaming.',
      req: 'telemetry ietf subscription 101\n encoding encode-kvgpb\n filter xpath /interfaces-ios-xe-oper:interfaces/interface/statistics\n stream yang-push\n update-policy periodic 500\n receiver ip address 10.10.99.50 57400 protocol grpc-tcp',
      res: '// Decoded Protobuf Telemetry Frame (Streamed every 5.0s)\n{\n  "node_id_str": "Core-RTR1",\n  "encoding_path": "Cisco-IOS-XE-interfaces-oper:interfaces/interface/statistics",\n  "data_gpbkv": {\n    "name": "GigabitEthernet1",\n    "rx_kbps": 482100,\n    "tx_kbps": 391450,\n    "in_discards": 0\n  }\n}'
    },
    'gnmi-sub': {
      reqTitle: 'gNMI SubscribeRequest (OpenConfig YANG)',
      transport: 'gNMI over gRPC | HTTP/2',
      encoding: 'Protobuf (Binary)',
      explain: 'gNMI (gRPC Network Management Interface) combines configuration and streaming telemetry into a single unified gRPC service using OpenConfig YANG models.',
      note: 'Supports STREAM (periodic/on-change), ONCE, and POLL subscription modes over a single persistent HTTP/2 connection.',
      req: 'service gNMI {\n  rpc Subscribe(stream SubscribeRequest) returns (stream SubscribeResponse);\n}\n\n// SubscribeRequest (Protobuf definition):\nsubscribe {\n  prefix { origin: "openconfig" }\n  subscription { path: "interfaces/interface[name=Eth1/1]/state/counters" mode: SAMPLE sample_interval: 1000000000 }\n}',
      res: '// SubscribeResponse (On-Change / Sampled Update)\nupdate {\n  timestamp: 1795056300000000000\n  update {\n    path { elem { name: "in-octets" } }\n    val { uint_val: 9841205440 }\n  }\n}'
    },
    'soap-axl': {
      reqTitle: 'SOAP HTTP POST Request (Strict XML Envelope)',
      transport: 'HTTPS | TCP 443 (WSDL)',
      encoding: 'XML (<soap:Envelope>)',
      explain: 'SOAP (Simple Object Access Protocol) wraps every RPC call in a strict XML <Envelope>, <Header>, and <Body> validated against a WSDL contract.',
      note: 'Heavier and more verbose than REST/JSON; seen in legacy enterprise systems (such as Cisco CUCM AXL APIs).',
      req: 'POST /axl/ HTTP/1.1\nSOAPAction: "CUCM:DB ver=14.0 getUser"\nContent-Type: text/xml; charset=utf-8\n\n<soapenv:Envelope xmlns:soapenv="http://xmlsoap.org">\n  <soapenv:Header/>\n  <soapenv:Body>\n    <ns:getUser xmlns:ns="http://cisco.com">\n      <userid>qhussain</userid>\n    </ns:getUser>\n  </soapenv:Body>\n</soapenv:Envelope>',
      res: '<soapenv:Envelope xmlns:soapenv="http://xmlsoap.org">\n  <soapenv:Body>\n    <ns:getUserResponse xmlns:ns="http://cisco.com">\n      <return>\n        <user><userid>qhussain</userid><department>Network-Eng</department></user>\n      </return>\n    </ns:getUserResponse>\n  </soapenv:Body>\n</soapenv:Envelope>'
    }
  };

  var gsSelect = document.getElementById('gsSelect');
  function renderGrpcSoap() {
    var item = gsScenarios[gsSelect.value];
    document.getElementById('gsReqTitle').textContent = item.reqTitle;
    document.getElementById('gsTransport').textContent = item.transport;
    document.getElementById('gsEncoding').textContent = item.encoding;
    document.getElementById('gsExplain').textContent = item.explain;
    document.getElementById('gsNote').textContent = item.note;
    document.getElementById('gsReqCode').textContent = item.req;
    document.getElementById('gsResCode').textContent = item.res;
  }
  gsSelect.addEventListener('change', renderGrpcSoap);
  renderGrpcSoap();


  // --- 3. Interactive YANG Node Inspector ---
  var yangNodes = [
    {
      label: '1. Container',
      html: '<strong>YANG Container:</strong> Groups related child nodes into a hierarchy without holding a value itself. Maps to a <strong>JSON Object <code>{ }</code></strong>. Example: <code>container interfaces { ... }</code> → <code>"ietf-interfaces:interfaces": { }</code>.'
    },
    {
      label: '2. List (Keyed)',
      html: '<strong>YANG List:</strong> Represents multiple instances uniquely identified by a <code>key</code> leaf (such as interface name or VLAN ID). Maps to a <strong>JSON Array of Objects <code>[ { } ]</code></strong>. In RESTCONF URIs, keys use <code>=</code> (e.g., <code>interface=Loopback10</code>).'
    },
    {
      label: '3. Leaf',
      html: '<strong>YANG Leaf:</strong> Holds a single typed scalar value (<code>string</code>, <code>uint32</code>, <code>boolean</code>, <code>inet:ipv4-address</code>) and has no children. Maps to a standard <strong>JSON Key-Value Pair</strong> (e.g., <code>"enabled": true</code>).'
    },
    {
      label: '4. Leaf-List',
      html: '<strong>YANG Leaf-List:</strong> A sequence of scalar values of the same data type (such as multiple DNS servers or NTP peers). Maps to a <strong>JSON Array of Primitives <code>[ "8.8.8.8", "1.1.1.1" ]</code></strong>.'
    }
  ];

  var yangPills = document.getElementById('yangPills');
  var yangDetail = document.getElementById('yangDetail');

  yangNodes.forEach(function (node, idx) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'yang-pill' + (idx === 0 ? ' active' : '');
    btn.textContent = node.label;
    btn.addEventListener('click', function () {
      yangPills.querySelectorAll('.yang-pill').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      yangDetail.innerHTML = node.html;
    });
    yangPills.appendChild(btn);
  });

  yangDetail.innerHTML = yangNodes[0].html;

  // Close parent modal on Esc key when embedded in 4any1
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && window.parent !== window) {
      window.parent.postMessage('closeAutomationModal', '*');
    }
  });

  renderRestconf();
});
