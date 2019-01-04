const natural = require('natural')
const assert = require('assert')
const compromise = require('compromise')
const debug = require('debug')('similarto')

function wordnet(text) {
  return new Promise((resolve, reject) => {
    let wn = new natural.WordNet();
    wn.lookup(text, (result) => {
      if(result.length === 0) {
        debug('Found no associations for: ' + text)
        resolve([])
      } else {
        // How do we determine which result we want ?
        // How do we know if we should use the definition to help find synonyms?
        let def = result.reduce((acc, v) => acc.synsetOffset < v.synsetOffset ? acc : v, result[0]).def

        let synonyms = result.map((x) => x.synonyms)
          .reduce((acc, x) => acc.concat(x), []).filter((x) => x !== text)
          .concat(compromise(def).nouns().toSingular().out('array').map((x) => x.split(' ')).reduce((acc, v) => acc.concat(v), []))
        debug('Found associations for: ' + text + ' => ' + synonyms.join(','))
        resolve(synonyms)
      }
    });
  });
}

module.exports = async function(compare, against) {
  assert.ok(Array.isArray(against), 'An array of strings was not passed as the second argument')
  assert.ok(typeof compare === 'string', 'The first argument was not a string.')
  assert.ok(against.filter((x) => typeof x !== 'string').length === 0, 'The second argument did not contain an array of strings but an array of mixed bags.')
  assert.ok(against.length !== 0, 'The second argument did not contain any values.')
  assert.ok(compare !== '', 'The first argument was a blank string.')
  assert.ok(against.filter((x) => x === '').length === 0, 'The second argument contained blank strings.')

  // get subset of nouns and verbs
  let compareObj = compromise(compare)
  let compareTerms = compareObj.nouns().toSingular().out('array')
    .concat(compareObj.verbs().out('array'))
    .concat(compareObj.adjectives().out('array'))
    .map((x) => x.split(' '))
    .reduce((a, v) => a.concat(v), [])
    .filter((x) => x.length > 2);
  let againstTerms = against.map((x) => {
    let xObj = compromise(x)
    return xObj.nouns().toSingular().out('array')
      .concat(xObj.verbs().out('array'))
      .concat(xObj.adjectives().out('array'))
      .map((x) => x.split(' '))
      .reduce((a, v) => a.concat(v), [])
      .filter((x) => x.length > 2)
  });

  // expand all terms with synonyms
  compareTerms = [...new Set((await Promise.all(compareTerms.map(async (x) => [x].concat(await wordnet(x))))).reduce((acc, v) => acc.concat(v), []))].filter((x) => x.length > 2);
  againstTerms = await Promise.all(againstTerms.map(async (y) => {
    return [...new Set((await Promise.all(y.map(async (x) => [x].concat(await wordnet(x))))).reduce((acc, v) => acc.concat(v), []) )]
    .filter((x) => x.length > 2)
  }));

  // run distance (maximum association between any two words then over the whole term the average association)
  let distances = againstTerms.map((terms) => {
    return terms
      .map((y) => compareTerms.map((x) => natural.JaroWinklerDistance(x, y, undefined, true)).reduce((acc, x) => Math.max(acc, x), 0))
      .reduce((acc, x) => acc + x, 0) / terms.length;
  }).map((x) => x || 0);

  debug('distances', distances)
  return distances.reduce((a, value, index) => a.value > value ? a : {value, index, text:against[index]}, {value:0, index:0, text:against[0]});
}