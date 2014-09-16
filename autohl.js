/*********

1. Get text from the DOM, may need to deal with formatting tags
2. Tokenize text into sentences  (split on .!? is first attempt) (DONE)
3. Tokenize sentences into words (split on white space is first attempt) (DONE)
4. Remove stop words (not sure if this is needed, but can use Porter's list) (using min_word_length like Python code)
5. Normalize words; lower-case, punctuation removed, stemmed  (Porter stemmer included)  (DONE)
6. Compute simliarity matrix (DONE)
7. Calculate ranks via PageRank (DONE)
8. Tag words back in the DOM by their rank

**********/

function sentence_tokenizer(raw_text) {
  /***********
  
  Split on [.!?]\s+ unless abbreviation (single letter U.S.A. e.g. i.e. or known list Mr. Mrs. Dr.)
  also could handle edge case of quoted character "?" or parenthetical (!!!)
  
  ***********/
  
  return raw_text.split(/[.!?]\s+/);
}

function word_tokenizer(sentence_text) {
  /***********
  
  Split on whitespace, can't think of any obvious cases to catch. 
  Also split on punctuation except "'"?
  If strip punctuation here, must account for contractions in stop word list.
  
  ***********/
  var punctRE = /[\u2000-\u206F\u2E00\u2E7F\\'!"#\$%&\(\)\*\+,\.\/:;<=>\?@\[\]\^_`\{\|\}~]/g;
  return sentence_text.replace(punctRE,'').split(/[\-\s]+/);
}

function normalize_word_sentences(word_sentences) {
  /******
  convert incoming words to lowercase if not stop words
  ******/
  var norm_word_sentences = [];
  norm_word_sentences.length = word_sentences.length;
  for(var i in word_sentences) {
    norm_word_sentences[i] = [];
    for(var j in word_sentences[i]) {
      if(!is_stop_word(word_sentences[i][j]))
        norm_word_sentences[i].push(word_sentences[i][j].toLowerCase());
    }
  }
  return norm_word_sentences;
}

function stem_words(norm_word_sentences) {
  /*****
  Stem each word and place into object as key to capture set property
  *****/
  var stem_sentences = [];
  stem_sentences.length = norm_word_sentences.length;
  for(var i in word_sentences) {
    stem_sentences[i] = {};
    for(var j in norm_word_sentences[i]) {
      if(!is_stop_word(norm_word_sentences[i][j]))
        stem_sentences[i][stemmer(norm_word_sentences[i][j])] = 1;
    }
  }
  return stem_sentences;

}

function is_stop_word(word) {
  /***********
  
  Check if in stop word list, for now replicating dumb method from Python code of checking length
  
  ***********/
  var min_word_length = 5;
  return word.length < min_word_length;
}

function sim_text_rank(sent_1,sent_2,options) {
    /****
    Similarity between two sets of words given by the number of words in common
    divided by the log of the size of each set.  the parameter eps=0.01 gives the
    score for the pathological case of two identical one word sets
    ****/
    var default_options = {
      eps: 0.01
    };
    options = options || {};
    for(var opt in default_options) {
      if(default_options.hasOwnProperty(opt) && !options.hasOwnProperty(opt))
        options[opt] = default_options[opt];
    };
    var numerator = 0;
    for(var item in sent_1)
      if(sent_1.hasOwnProperty(item) && sent_2.hasOwnProperty(item))
        numerator++;
    if(numerator>0)
        return numerator/(Math.log(Object.keys(sent_1).length+options.eps)+Math.log(Object.keys(sent_2).length+options.eps));
    return 0;
}

function generate_similarity_matrix(stem_sentences,options) {
    /***
    Computes the similarity matrix (symmetric) for a list of sets of words
    using the similarity function sim_func
    ***/
    var default_options = {
      sim_func: sim_text_rank
    };
    options = options || {};
    for(var opt in default_options) {
      if(default_options.hasOwnProperty(opt) && !options.hasOwnProperty(opt))
        options[opt] = default_options[opt];
    };
    var N_sentences = stem_sentences.length;
    var sim_matrix = [];
    sim_matrix.length = N_sentences;
    for(var i=0; i<N_sentences; i++) {
      sim_matrix[i] = [];
      sim_matrix[i].length = N_sentences;
      for(var j=0; j<N_sentences; j++) {
        sim_matrix[i][j] =0;
      }
    }
    for(var i=0; i<N_sentences; i++) {
        for(var j=i+1; j<N_sentences; j++) {
                sim_matrix[i][j] = options.sim_func(stem_sentences[i],stem_sentences[j]);
                sim_matrix[j][i] = sim_matrix[i][j];
        }
    }
    return sim_matrix;
}

function page_rank(sim_matrix,options) {
    /******
    The PageRank algorithm for an undirected weighted graph
    ******/
    var default_options = {
      alpha: 0.85,
      max_iterations: 200,
      tol: 1e-8
      };
    options = options || {};
    for(var opt in default_options) {
      if(default_options.hasOwnProperty(opt) && !options.hasOwnProperty(opt))
        options[opt] = default_options[opt];
    };
    var N_sentences = sim_matrix.length;
    var weights = [];
    weights.length = N_sentences;
    for(row in sim_matrix) {
      weights[row] = sum(sim_matrix[row]);
    };
    // normalize the similarity matrix
    for(row in sim_matrix)
        for(col in sim_matrix[row])
            if(weights[col]>0)
                sim_matrix[row][col] = sim_matrix[row][col]/weights[col];
    var scores = [];  // initialize pageranks
    scores.length = N_sentences;  
    for(var i=0; i<N_sentences; i++)
      scores[i] = 1;
    var i=0;  // iterations
    while(i<options.max_iterations) {
        var prev_scores = scores.slice(0);
        for( row in scores ){
           scores[row] = (1.-options.alpha) + options.alpha * dotproduct(sim_matrix[row],prev_scores);
        }
        if( check_convergence(scores,prev_scores,options.tol) ) {
               return scores;
        }
        i++;
    };
    console.log("Max pagerank iterations exceeded");   
    return scores;
}

function sum(arr) {
  return arr.reduce(function(a,b) {return a+b;});
}

function dotproduct(a,b) {
  var total = 0;
  for(i in a) {
    total += a[i]*b[i];
  }
  return total;
}

function check_convergence(scores,prev_scores,tolerance) {
  for(row in scores) {
    if(Math.abs(scores[row]-prev_scores[row])>tolerance)
      return false;
  }
  return true;
}

// Porter stemmer in Javascript. Few comments, but it's easy to follow against the rules in the original
// paper, in
//
//  Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14,
//  no. 3, pp 130-137,
//
// see also http://www.tartarus.org/~martin/PorterStemmer

// Release 1 be 'andargor', Jul 2004
// Release 2 (substantially revised) by Christopher McKenzie, Aug 2009

var stemmer = (function(){
    var step2list = {
            "ational" : "ate",
            "tional" : "tion",
            "enci" : "ence",
            "anci" : "ance",
            "izer" : "ize",
            "bli" : "ble",
            "alli" : "al",
            "entli" : "ent",
            "eli" : "e",
            "ousli" : "ous",
            "ization" : "ize",
            "ation" : "ate",
            "ator" : "ate",
            "alism" : "al",
            "iveness" : "ive",
            "fulness" : "ful",
            "ousness" : "ous",
            "aliti" : "al",
            "iviti" : "ive",
            "biliti" : "ble",
            "logi" : "log"
        },

        step3list = {
            "icate" : "ic",
            "ative" : "",
            "alize" : "al",
            "iciti" : "ic",
            "ical" : "ic",
            "ful" : "",
            "ness" : ""
        },

        c = "[^aeiou]",          // consonant
        v = "[aeiouy]",          // vowel
        C = c + "[^aeiouy]*",    // consonant sequence
        V = v + "[aeiou]*",      // vowel sequence

        mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
        meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
        mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
        s_v = "^(" + C + ")?" + v;                   // vowel in stem

    return function (w) {
        var     stem,
            suffix,
            firstch,
            re,
            re2,
            re3,
            re4,
            origword = w;

        if (w.length < 3) { return w; }

        firstch = w.substr(0,1);
        if (firstch == "y") {
            w = firstch.toUpperCase() + w.substr(1);
        }

        // Step 1a
        re = /^(.+?)(ss|i)es$/;
        re2 = /^(.+?)([^s])s$/;

        if (re.test(w)) { w = w.replace(re,"$1$2"); }
        else if (re2.test(w)) { w = w.replace(re2,"$1$2"); }

        // Step 1b
        re = /^(.+?)eed$/;
        re2 = /^(.+?)(ed|ing)$/;
        if (re.test(w)) {
            var fp = re.exec(w);
            re = new RegExp(mgr0);
            if (re.test(fp[1])) {
                re = /.$/;
                w = w.replace(re,"");
            }
        } else if (re2.test(w)) {
            var fp = re2.exec(w);
            stem = fp[1];
            re2 = new RegExp(s_v);
            if (re2.test(stem)) {
                w = stem;
                re2 = /(at|bl|iz)$/;
                re3 = new RegExp("([^aeiouylsz])\\1$");
                re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
                if (re2.test(w)) {  w = w + "e"; }
                else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
                else if (re4.test(w)) { w = w + "e"; }
            }
        }

        // Step 1c
        re = /^(.+?)y$/;
        if (re.test(w)) {
            var fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(s_v);
            if (re.test(stem)) { w = stem + "i"; }
        }

        // Step 2
        re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
        if (re.test(w)) {
            var fp = re.exec(w);
            stem = fp[1];
            suffix = fp[2];
            re = new RegExp(mgr0);
            if (re.test(stem)) {
                w = stem + step2list[suffix];
            }
        }

        // Step 3
        re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
        if (re.test(w)) {
            var fp = re.exec(w);
            stem = fp[1];
            suffix = fp[2];
            re = new RegExp(mgr0);
            if (re.test(stem)) {
                w = stem + step3list[suffix];
            }
        }

        // Step 4
        re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
        re2 = /^(.+?)(s|t)(ion)$/;
        if (re.test(w)) {
            var fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(mgr1);
            if (re.test(stem)) {
                w = stem;
            }
        } else if (re2.test(w)) {
            var fp = re2.exec(w);
            stem = fp[1] + fp[2];
            re2 = new RegExp(mgr1);
            if (re2.test(stem)) {
                w = stem;
            }
        }

        // Step 5
        re = /^(.+?)e$/;
        if (re.test(w)) {
            var fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(mgr1);
            re2 = new RegExp(meq1);
            re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
            if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
                w = stem;
            }
        }

        re = /ll$/;
        re2 = new RegExp(mgr1);
        if (re.test(w) && re2.test(w)) {
            re = /.$/;
            w = w.replace(re,"");
        }

        // and turn initial Y back to y

        if (firstch == "y") {
            w = firstch.toLowerCase() + w.substr(1);
        }

        return w;
    }
})();

/**************

Test code below

**************/

var raw_text = 'Clustering data by identifying a subset of representative examples is important for processing\nsensory signals and detecting patterns in data. Such \u201cexemplars\u201d can be found by randomly\nchoosing an initial subset of data points and then iteratively refining it, but this works well only if\nthat initial choice is close to a good solution. We devised a method called \u201caffinity propagation,\u201d\nwhich takes as input measures of similarity between pairs of data points. Real-valued messages are\nexchanged between data points until a high-quality set of exemplars and corresponding clusters\ngradually emerges. We used affinity propagation to cluster images of faces, detect genes in\nmicroarray data, identify representative sentences in this manuscript, and identify cities that are\nefficiently accessed by airline travel. Affinity propagation found clusters with much lower error than\nother methods, and it did so in less than one-hundredth the amount of time.';

var sentences = ['Clustering data by identifying a subset of representative examples is important for processing\nsensory signals and detecting patterns in data.', 'Such \u201cexemplars\u201d can be found by randomly\nchoosing an initial subset of data points and then iteratively refining it, but this works well only if\nthat initial choice is close to a good solution.', 'We devised a method called \u201caffinity propagation,\u201d\nwhich takes as input measures of similarity between pairs of data points.', 'Real-valued messages are\nexchanged between data points until a high-quality set of exemplars and corresponding clusters\ngradually emerges.', 'We used affinity propagation to cluster images of faces, detect genes in\nmicroarray data, identify representative sentences in this manuscript, and identify cities that are\nefficiently accessed by airline travel.', 'Affinity propagation found clusters with much lower error than\nother methods, and it did so in less than one-hundredth the amount of time.'];

var word_sentences = [['Clustering', 'data', 'by', 'identifying', 'a', 'subset', 'of', 'representative', 'examples', 'is', 'important', 'for', 'processing', 'sensory', 'signals', 'and', 'detecting', 'patterns', 'in', 'data', '.'], ['Such', '\u201c', 'exemplars', '\u201d', 'can', 'be', 'found', 'by', 'randomly', 'choosing', 'an', 'initial', 'subset', 'of', 'data', 'points', 'and', 'then', 'iteratively', 'refining', 'it', ',', 'but', 'this', 'works', 'well', 'only', 'if', 'that', 'initial', 'choice', 'is', 'close', 'to', 'a', 'good', 'solution', '.'], ['We', 'devised', 'a', 'method', 'called', '\u201c', 'affinity', 'propagation', ',\u201d', 'which', 'takes', 'as', 'input', 'measures', 'of', 'similarity', 'between', 'pairs', 'of', 'data', 'points', '.'], ['Real', '-', 'valued', 'messages', 'are', 'exchanged', 'between', 'data', 'points', 'until', 'a', 'high', '-', 'quality', 'set', 'of', 'exemplars', 'and', 'corresponding', 'clusters', 'gradually', 'emerges', '.'], ['We', 'used', 'affinity', 'propagation', 'to', 'cluster', 'images', 'of', 'faces', ',', 'detect', 'genes', 'in', 'microarray', 'data', ',', 'identify', 'representative', 'sentences', 'in', 'this', 'manuscript', ',', 'and', 'identify', 'cities', 'that', 'are', 'efficiently', 'accessed', 'by', 'airline', 'travel', '.'], ['Affinity', 'propagation', 'found', 'clusters', 'with', 'much', 'lower', 'error', 'than', 'other', 'methods', ',', 'and', 'it', 'did', 'so', 'in', 'less', 'than', 'one', '-', 'hundredth', 'the', 'amount', 'of', 'time', '.']];

var norm_word_sentences = [['clustering', 'identifying', 'subset', 'representative', 'examples', 'important', 'processing', 'sensory', 'signals', 'detecting', 'patterns'], ['exemplars', 'found', 'randomly', 'choosing', 'initial', 'subset', 'points', 'iteratively', 'refining', 'works', 'initial', 'choice', 'close', 'solution'], ['devised', 'method', 'called', 'affinity', 'propagation', 'which', 'takes', 'input', 'measures', 'similarity', 'between', 'pairs', 'points'], ['valued', 'messages', 'exchanged', 'between', 'points', 'until', 'quality', 'exemplars', 'corresponding', 'clusters', 'gradually', 'emerges'], ['affinity', 'propagation', 'cluster', 'images', 'faces', 'detect', 'genes', 'microarray', 'identify', 'representative', 'sentences', 'manuscript', 'identify', 'cities', 'efficiently', 'accessed', 'airline', 'travel'], ['affinity', 'propagation', 'found', 'clusters', 'lower', 'error', 'other', 'methods', 'hundredth', 'amount']];

var stem_sentences = [{'subset':1, 'sensori':1, 'detect':1, 'identifi':1, 'process':1, 'pattern':1, 'signal':1, 'repres':1, 'cluster':1, 'exampl':1, 'import':1}, {'randomli':1, 'subset':1, 'work':1, 'point':1, 'solut':1, 'refin':1, 'choic':1, 'initi':1, 'exemplar':1, 'iter':1, 'choos':1, 'close':1, 'found':1}, {'propag':1, 'measur':1, 'similar':1, 'point':1, 'affin':1, 'call':1, 'take':1, 'which':1, 'between':1, 'pair':1, 'input':1, 'devis':1, 'method':1}, {'gradual':1, 'point':1, 'exchang':1, 'qualiti':1, 'correspond':1, 'messag':1, 'cluster':1, 'emerg':1, 'exemplar':1, 'between':1, 'until':1, 'val':1}, {'propag':1, 'repres':1, 'detect':1, 'identifi':1, 'manuscript':1, 'microarray':1, 'airlin':1, 'sentenc':1, 'imag':1, 'face':1, 'access':1, 'cluster':1, 'citi':1, 'effici':1, 'gene':1, 'affin':1, 'travel':1}, {'propag':1, 'lower':1, 'hundredth':1, 'method':1, 'cluster':1, 'amount':1, 'other':1, 'error':1, 'found':1, 'affin':1}];

var sim_matrix = [[ 0.        ,  0.20142925,  0.        ,  0.20472742,  0.76443755,         0.21265788],
       [ 0.20142925,  0.        ,  0.1948772 ,  0.3959253 ,  0.        ,         0.20536821],
       [ 0.        ,  0.1948772 ,  0.        ,  0.3959253 ,  0.37040332,         0.61610462],
       [ 0.20472742,  0.3959253 ,  0.3959253 ,  0.        ,  0.18798614,         0.20879772],
       [ 0.76443755,  0.        ,  0.37040332,  0.18798614,  0.        ,         0.58395456],
       [ 0.21265788,  0.20536821,  0.61610462,  0.20879772,  0.58395456,         0.        ]];


var pr = [ 0.9206212 ,  0.71242271,  1.03351121,  0.94268736,  1.21602883, 1.17472869];


/***

console.log(generate_similarity_matrix(stem_sentences));
console.log(page_rank(sim_matrix));
console.log(sum(pr));
console.log(Object.keys(stem_sentences[0]).length);
for(row in sentences) console.log(sentences[row]);
console.log(is_stop_word('data'));
console.log(is_stop_word('datum'));
console.log(is_stop_word('clustering'));

var test_norm_word_sentences = normalize_word_sentences(word_sentences);
console.log(test_norm_word_sentences);

var test_stem_sentences = stem_words(test_norm_word_sentences);
console.log(test_stem_sentences);

for(row in test_stem_sentences) {

  for(var item in test_stem_sentences[row])
      if(test_stem_sentences[row].hasOwnProperty(item) && !stem_sentences[row].hasOwnProperty(item)) {
        console.log('Stem not matched from code');
        console.log(item);
      }
  
  for(var item in stem_sentences[row])
      if(stem_sentences[row].hasOwnProperty(item) && !test_stem_sentences[row].hasOwnProperty(item))  {
        console.log('Stem not matched produced by code');
        console.log(item);
      }
}

var test_sim_matrix = generate_similarity_matrix(test_stem_sentences);
var test_pr = page_rank(test_sim_matrix);
console.log(test_pr);

console.log(sentence_tokenizer(raw_text));

console.log(word_tokenizer(sentences[0]));

console.log(generate_similarity_matrix(stem_sentences));
console.log(page_rank(sim_matrix));
***/

var test_raw_sentences = sentence_tokenizer(raw_text);
var test_word_sentences = [];
test_word_sentences.length = test_raw_sentences.length;
for(var i in test_raw_sentences) {
  test_word_sentences[i] = word_tokenizer(test_raw_sentences[i]);
}
var test_norm_word_sentences = normalize_word_sentences(test_word_sentences);
//console.log(test_norm_word_sentences);

var test_stem_sentences = stem_words(test_norm_word_sentences);

console.log('Sentence tokenization, word splitting and stemming errors:');

for(row in test_stem_sentences) {

  for(var item in test_stem_sentences[row])
      if(test_stem_sentences[row].hasOwnProperty(item) && !stem_sentences[row].hasOwnProperty(item)) {
        console.log('Stem produced by code but not found in test data: ' + item);
      }
  
  for(var item in stem_sentences[row])
      if(stem_sentences[row].hasOwnProperty(item) && !test_stem_sentences[row].hasOwnProperty(item))  {
        console.log('Stem not produced by code but in test data: ' + item);
      }
}

//console.log(test_stem_sentences);

var test_sim_matrix = generate_similarity_matrix(test_stem_sentences);
var test_pr = page_rank(test_sim_matrix);

//console.log(test_pr);

console.log('\nDifference in produced TextRanks (convergence tolerance = 1e-8):');
for(var i in test_pr)
  console.log(test_pr[i]-pr[i]);

/*******
for(var i in test_norm_word_sentences) 
  for(var j in test_norm_word_sentences[i]) {
    console.log(norm_word_sentences[i][j]+' '+test_norm_word_sentences[i][j]);
}  

for(var i in test_stem_sentences) 
  for(var item in test_stem_sentences[i]) {
    console.log(item);
}  
//console.log(word_sentences);
//console.log(test_word_sentences);
//console.log('test'+' me');

console.log('\u201d');
console.log(raw_text);
********/
