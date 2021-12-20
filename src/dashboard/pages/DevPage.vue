<template lang="pug">
v-container
  v-card.mb-2
    v-btn(@click="enableDemoMode()")
      | Enable demo mode
    v-btn(@click="logStore()")
      | Log store to console
    v-btn(@click="attributeFromRegistry()")
      | Attribute using registry
    v-btn(@click="db.cleanDisconnected()")
      | Clean disconnected

  v-card
    h3 Johannes database stuff (probably broken)
    v-layout(row)
      v-flex(xs3)
        v-select(:disabled='loading', v-model='select', :items='databaseNames')
      v-flex(xs3)
        v-btn(:disabled='loading || !select', @click='loadDB()') Load Database
        v-btn(:disabled='!loaded || loading', @click='exportFile()') Export
      v-flex(xs3)
        v-combobox(:disabled='loading', label='Destination database', v-model='destination', :items='databaseNames')
      v-flex(xs3)
        v-btn(:disabled='!filename || loading', @click='importFile()') Import
        input(type="file", :multiple="false", :disabled="false", @change="onFileChange")
    v-textarea(:value='logger', rows='40')
</template>
<script>
import Dexie from 'dexie';
import _ from 'lodash';
import { getDatabase } from '~/lib/db.ts';

export default {
  components: {},
  data: () => ({
    db: getDatabase(),
    loading: false,
    loaded: false,
    logger: '',
    databaseNames: [],
    select: '',
    destination: '',
    dbobj: {},
    filename: '',
    data: {},
  }),
  methods: {
    logStore() {
      console.log(this.$store.state.db);
    },
    async attributeFromRegistry() {
      await this.db._attributeActivityToCreatorFromRegistry();
      console.log('Attributed activity to creators using registry');
      await this.db._attributeAddressToCreatorFromRegistry();
      console.log('Attributed addresses to creators using registry');
    },
    enableDemoMode() {
      this.$store.commit('db/demomode');
    },
    onFileChange($event) {
      const files = $event.target.files || $event.dataTransfer.files;
      if (files) {
        if (files.length > 0) {
          this.loading = true;
          this.filename = [...files].map((file) => file.name).join(', ');
          const file = files[0];
          const fileReader = new FileReader();
          fileReader.addEventListener('load', () => {
            this.data = JSON.parse(fileReader.result);
            this.log(`Loaded '${this.filename}'`);
            this.destination = this.data.name;
            this.loading = false;
          });
          fileReader.readAsText(file);
        } else {
          this.filename = null;
        }
      } else {
        this.filename = $event.target.value.split('\\').pop();
      }
    },
    log(text) {
      this.logger += text + '\n';
    },
    importFile() {
      const log = this.log;
      (async (dest, { db, schema, verno }) => {
        if (Dexie.exists(dest)) {
          log('Database exists, deleting...');
          try {
            await Dexie.delete(dest);
          } catch (err) {
            log('Delete failed: ' + err);
          }
        }
        let newdb = new Dexie(dest);
        newdb.version(verno).stores(schema);
        await Promise.all(
          _.map(db, (items, key) =>
            newdb[key].bulkAdd(items).catch(Dexie.BulkError, (e) => log(e))
          )
        );
        log(`Database '${dest}' imported`);
      })(this.destination, this.data);
    },
    exportFile() {
      let a = document.createElement('a');
      let file = new Blob([JSON.stringify(this.dbobj)], { type: 'text/plain' });
      a.href = URL.createObjectURL(file);
      a.download = this.select + '.json';
      a.click();
    },
    loadDB() {
      this.loading = true;
      const log = this.log;
      log(this.select);
      let db = new Dexie(this.select);
      db.open()
        .then(() => {
          this.dbobj = { db: {}, schema: {} };
          log(`DB NAME: ${db.name}`);
          log(`DB VERSION: ${db.verno}`);
          this.dbobj.name = db.name;
          this.dbobj.verno = db.verno;
          db.tables.forEach(async (table, i) => {
            let primKeyAndIndexes = [table.schema.primKey].concat(
              table.schema.indexes
            );
            let schemaSyntax = primKeyAndIndexes
              .map((index) => {
                return index.src;
              })
              .join(',');
            log(
              `    ${table.name}: '${schemaSyntax}' ${
                i < db.tables.length - 1 ? ',' : ''
              }`
            );
            this.dbobj.db[table.name] = await table.toArray();
            this.dbobj.schema[table.name] = schemaSyntax;
            if (_.size(this.dbobj.db) === db.tables.length) {
              this.loading = false;
              this.loaded = true;
              log(JSON.stringify(this.dbobj.schema));
            }
          });
        })
        .finally(() => db.close());
    },
  },
  mounted() {
    (async () => {
      this.databaseNames = await Dexie.getDatabaseNames();
    })();
  },
  watch: {},
};
</script>
