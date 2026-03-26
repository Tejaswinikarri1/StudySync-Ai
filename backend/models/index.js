const mongoose = require('mongoose');

// ── Group ─────────────────────────────────────────────────────────────────────
const groupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  subject:     { type: String, required: true },
  desc:        { type: String, default: '' },
  maxSize:     { type: Number, default: 8 },
  tags:        [{ type: String }],
  avatar:      { type: String, default: '' },      // emoji avatar for the group
  color:       { type: String, default: '#6366f1' }, // gradient colour
  isPublic:    { type: Boolean, default: true },
  admin:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inviteCode:  { type: String, required: true, unique: true },
  // Join requests: { user, status: pending|accepted|declined, createdAt }
  joinRequests: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:    { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// ── Message ───────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  type:      { type: String, enum: ['group','dm'], required: true },
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  text:      { type: String, required: true },
  reactions: [{ type: String }],
  isSystem:  { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ type:1, sender:1, receiver:1 });
messageSchema.index({ type:1, group:1, createdAt:1 });

// ── Session ───────────────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  groupName: { type: String, default: '' },
  date:      { type: String, required: true },
  time:      { type: String, required: true },
  duration:  { type: Number, default: 60 },
  meetLink:  { type: String, default: null },
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['upcoming','completed','cancelled'], default: 'upcoming' },
}, { timestamps: true });

// ── Study Log ─────────────────────────────────────────────────────────────────
const studyLogSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
  group:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group',   default: null },
  subject: { type: String, default: 'General Study' },
  minutes: { type: Number, required: true },
  date:    { type: String, required: true },
  source:  { type: String, enum: ['timer','session','manual'], default: 'timer' },
}, { timestamps: true });

studyLogSchema.index({ user:1, date:1 });

// ── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['match','group','message','session','connection','join_request','join_approved'], required: true },
  text:    { type: String, required: true },
  read:    { type: Boolean, default: false },
  link:    { type: String, default: null },
  meta:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ user:1, read:1 });

module.exports = {
  Group:        mongoose.model('Group',        groupSchema),
  Message:      mongoose.model('Message',      messageSchema),
  Session:      mongoose.model('Session',      sessionSchema),
  StudyLog:     mongoose.model('StudyLog',     studyLogSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
