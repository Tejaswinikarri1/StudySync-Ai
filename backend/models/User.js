const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, minlength: 6, select: false },
  phone:         { type: String, default: '' },
  college:       { type: String, default: '' },
  dept:          { type: String, default: '' },
  year:          { type: String, default: '1st Year' },
  location:      { type: String, default: '' },
  bio:           { type: String, default: '' },
  linkedIn:      { type: String, default: '' },
  github:        { type: String, default: '' },
  learningStyle: { type: String, enum: ['Visual','Auditory','Reading/Writing','Practical'], default: 'Visual' },
  studyMode:     { type: String, default: 'Solo + Group' },
  preferredTime: { type: String, default: 'Evening' },
  subjects:      [{ type: String }],
  skillLevel:    { type: String, enum: ['Beginner','Intermediate','Advanced'], default: 'Beginner' },
  avail:         { type: String, default: 'Evening' },
  goals:         { type: String, default: '' },
  weeklyTarget:  { type: Number, default: 10 },
  language:      { type: String, default: 'English' },
  timezone:      { type: String, default: 'IST (UTC+5:30)' },
  grad:          { type: String, default: '135deg,#6366f1,#8b5cf6' },

  // Email verification
  isVerified:         { type: Boolean, default: false },
  verificationToken:  { type: String, select: false },
  verificationExpiry: { type: Date, select: false },

  // Password reset
  resetPasswordToken:  { type: String, select: false },
  resetPasswordExpiry: { type: Date, select: false },

  // Live analytics — updated on activity
  totalFocusMinutes: { type: Number, default: 0 },
  totalSessions:     { type: Number, default: 0 },
  currentStreak:     { type: Number, default: 0 },
  lastStudyDate:     { type: String, default: null },
  badges:            [{ type: String }],

  // Connections
  connections: [{
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:        { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
    initiatedByMe: { type: Boolean, default: true },
    createdAt:     { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
