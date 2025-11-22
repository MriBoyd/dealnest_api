module.exports = {
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('newhashedpassword'),
};
