const confidence = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
const verificationStatus = value => ['Verified', 'Partially Verified', 'Information Not Verified'].includes(value) ? value : 'Information Not Verified';
module.exports = { confidence, verificationStatus };
