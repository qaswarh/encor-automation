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
