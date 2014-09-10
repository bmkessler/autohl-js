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
    for(item in sent_1)
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

var stem_sentences = [{'subset':1, 'sensori':1, 'detect':1, 'identifi':1, 'process':1, 'pattern':1, 'signal':1, 'repres':1, 'cluster':1, 'exampl':1, 'import':1}, {'randomli':1, 'subset':1, 'work':1, 'point':1, 'solut':1, 'refin':1, 'choic':1, 'initi':1, 'exemplar':1, 'iter':1, 'choos':1, 'close':1, 'found':1}, {'propag':1, 'measur':1, 'similar':1, 'point':1, 'affin':1, 'call':1, 'take':1, 'which':1, 'between':1, 'pair':1, 'input':1, 'devis':1, 'method':1}, {'gradual':1, 'point':1, 'exchang':1, 'qualiti':1, 'correspond':1, 'messag':1, 'cluster':1, 'emerg':1, 'exemplar':1, 'between':1, 'until':1, 'val':1}, {'propag':1, 'repres':1, 'detect':1, 'identifi':1, 'manuscript':1, 'microarray':1, 'airlin':1, 'sentenc':1, 'imag':1, 'face':1, 'access':1, 'cluster':1, 'citi':1, 'effici':1, 'gene':1, 'affin':1, 'travel':1}, {'propag':1, 'lower':1, 'hundredth':1, 'method':1, 'cluster':1, 'amount':1, 'other':1, 'error':1, 'found':1, 'affin':1}];

var sim_matrix = [[ 0.        ,  0.20142925,  0.        ,  0.20472742,  0.76443755,         0.21265788],
       [ 0.20142925,  0.        ,  0.1948772 ,  0.3959253 ,  0.        ,         0.20536821],
       [ 0.        ,  0.1948772 ,  0.        ,  0.3959253 ,  0.37040332,         0.61610462],
       [ 0.20472742,  0.3959253 ,  0.3959253 ,  0.        ,  0.18798614,         0.20879772],
       [ 0.76443755,  0.        ,  0.37040332,  0.18798614,  0.        ,         0.58395456],
       [ 0.21265788,  0.20536821,  0.61610462,  0.20879772,  0.58395456,         0.        ]];


var pr = [ 0.9206212 ,  0.71242271,  1.03351121,  0.94268736,  1.21602883, 1.17472869];

console.log(generate_similarity_matrix(stem_sentences));
console.log(page_rank(sim_matrix));
console.log(sum(pr));
console.log(Object.keys(stem_sentences[0]).length);