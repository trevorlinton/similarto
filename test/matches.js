const assert = require('assert')
const similarto = require('../index.js')

describe('similarto', function() {
  it('should not just accept longest text', async () => {
    assert.equal(await similarto('I\'m going to france', ['To be or not to be', 'I will be traveling to europe', 'You dont see that sort of behavior in major appliances', ]), 
      'I will be traveling to europe')
  })
  it('should be able to infer abstract meaning', async () => {
    assert.equal(await similarto('Happy birthday, i hope you have a great one', ['birthdays','years of service','recognition']),
      'birthdays')
  })
  it('should be able to infer intent', async () => {
    assert.equal(await similarto('Thank you for all your hard work on xyz. You really stepped up when we needed it.', ['celebration','recognition', 'years of service',]),
      'recognition')
  })
})