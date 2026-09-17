export class OdooClient {
  constructor({url, database, username, password}) {
    this.url = url.replace(/\/$/, '');
    this.database = database;
    this.username = username;
    this.password = password;
    this.uid = null;
  }
  async call(service, method, args = []) {
    const response = await fetch(`${this.url}/jsonrpc`, {
      method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', method: 'call', params: {service, method, args}, id: Date.now()})
    });
    const payload = await response.json();
    if (payload.error) throw new Error(JSON.stringify(payload.error));
    return payload.result;
  }
  async authenticate() {
    this.uid = await this.call('common', 'authenticate', [this.database, this.username, this.password, {}]);
    if (!this.uid) throw new Error('Odoo authentication failed');
    return this.uid;
  }
  async execute(model, method, args = [], kwargs = {}) {
    if (!this.uid) await this.authenticate();
    return this.call('object', 'execute_kw', [this.database, this.uid, this.password, model, method, args, kwargs]);
  }
}
