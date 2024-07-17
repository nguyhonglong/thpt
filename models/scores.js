const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  sbd: Number,
  toan: Number,
  ngu_van: Number,
  ngoai_ngu: Number,
  lich_su: Number,
  dia_li: Number,
  gdcd: Number,
  ma_ngoai_ngu: String,
  vat_li: Number,
  hoa_hoc: Number,
  sinh_hoc: Number,
  ma_ngoai_ngu: String
});

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;
