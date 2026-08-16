// Database configuration manager.
// Tries MongoDB Atlas first. If MongoDB is unreachable or MONGODB_URI is not
// set (or USE_MONGO is explicitly "false"), it transparently falls back to a
// local JSON file database (db.json) so the app keeps running without code
// changes. Both modes expose the same model API used by the routes.
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.resolve(__dirname, 'db.json');

// ---------------------------------------------------------------------------
// File fallback implementation (mongoose-compatible subset)
// ---------------------------------------------------------------------------

const randomId = () => crypto.randomUUID();

const clone = (value) => {
  if (value === undefined) return undefined;
  return structuredClone(value);
};

const matchesQuery = (doc, query = {}) =>
  Object.entries(query).every(([key, value]) => doc[key] === value);

class FallbackCollection {
  constructor(name) {
    this.name = name;
    this.items = [];
  }

  _persist() {
    const payload = {
      users: fileDb.users.map((u) => clone(u)),
      resumes: fileDb.resumes.map((r) => clone(r)),
    };
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
    fs.renameSync(tmp, DB_FILE);
  }

  find(query = {}) {
    return this.items.filter((doc) => matchesQuery(doc, query)).map(clone);
  }

  findOne(query = {}) {
    const found = this.items.find((doc) => matchesQuery(doc, query));
    return found ? clone(found) : null;
  }

  findById(id) {
    const found = this.items.find((doc) => doc._id === id);
    return found ? clone(found) : null;
  }

  create(doc) {
    const now = new Date();
    const newDoc = {
      _id: randomId(),
      createdAt: now,
      ...(this.name === 'resumes' ? { updatedAt: now } : {}),
      ...clone(doc),
    };
    if (newDoc.createdAt === undefined) newDoc.createdAt = now;
    if (this.name === 'resumes' && newDoc.updatedAt === undefined) {
      newDoc.updatedAt = now;
    }
    this.items.push(newDoc);
    this._persist();
    return clone(newDoc);
  }

  findByIdAndUpdate(id, update, options = {}) {
    const index = this.items.findIndex((doc) => doc._id === id);
    if (index === -1) return null;

    const doc = this.items[index];
    if (update && update.$set) {
      Object.assign(doc, clone(update.$set));
    } else if (update) {
      Object.assign(doc, clone(update));
    }
    if (this.name === 'resumes') doc.updatedAt = new Date();

    this._persist();
    return options.new ? clone(doc) : null;
  }

  findByIdAndDelete(id) {
    const index = this.items.findIndex((doc) => doc._id === id);
    if (index === -1) return null;
    const [removed] = this.items.splice(index, 1);
    this._persist();
    return clone(removed);
  }
}

// In-memory mirror of db.json, loaded lazily at connect time.
const fileDb = {
  users: [],
  resumes: [],
  initialized: false,
};

const loadFileDb = () => {
  if (!fs.existsSync(DB_FILE)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    fileDb.users = Array.isArray(parsed.users) ? parsed.users : [];
    fileDb.resumes = Array.isArray(parsed.resumes) ? parsed.resumes : [];
  } catch (error) {
    console.error('db.json is corrupt; starting with an empty database.', error.message);
    fileDb.users = [];
    fileDb.resumes = [];
  }
};

let fallbackUser = null;
let fallbackResume = null;
let useFallback = false;

const activateFallback = () => {
  if (!fileDb.initialized) {
    loadFileDb();
    fileDb.initialized = true;
  }
  fallbackUser = new FallbackCollection('users');
  fallbackUser.items = fileDb.users;
  fallbackResume = new FallbackCollection('resumes');
  fallbackResume.items = fileDb.resumes;
  useFallback = true;
  console.log('Fallback active: using local file database (db.json)');
};

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

const connect = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const useMongo = process.env.USE_MONGO !== 'false';

  if (useMongo && mongoUri) {
    console.log('Connecting to MongoDB Atlas...');
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000, // fail fast if Atlas is unreachable
        socketTimeoutMS: 10000,         // abort queries after 10s
        connectTimeoutMS: 8000,
      });
      useFallback = false;
      console.log('Successfully connected to MongoDB Atlas.');
      return;
    } catch (error) {
      console.error('MongoDB Atlas connection failed, falling back to db.json:', error.message);
    }
  } else {
    console.log('MONGODB_URI not configured; using local file database (db.json).');
  }

  activateFallback();
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  connect,
  disconnect: async () => {
    if (useFallback) {
      // File database persists synchronously on every write; nothing to flush.
      console.log('File database already persisted.');
      return;
    }
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  },
  isFallback: () => useFallback,
  get User() {
    return useFallback ? fallbackUser : require('./models').User;
  },
  get Resume() {
    return useFallback ? fallbackResume : require('./models').Resume;
  },
};
