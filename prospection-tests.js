//================================================================================

var casper = require('casper').create({
//    verbose: true,          // true or false
//    logLevel: 'debug',      // 'debug' 'info' 'warning' 'error'
    pageSettings: { // It seems to need to emulate Chrome for getting pure href.
        userAgent: 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.79 Safari/537.1'
    }
});

//================================================================================
//================================================================================
// Extending Casper functions for realizing label() and goto()
// 
// Functions:
//   checkStep()   Revised original checkStep()
//   then()        Revised original then()
//   label()       New function for making empty new navigation step and affixing the new label on it.
//   goto()        New function for jumping to the labeled navigation step that is affixed by label()
//   dumpSteps()   New function for Dump Navigation Steps. This is very helpful as a flow control debugging tool.
// 

var utils = require('utils');
var f = utils.format;

/**
 * Revised checkStep() function for realizing label() and goto()
 * Every revised points are commented.
 *
 * @param  Casper    self        A self reference
 * @param  function  onComplete  An options callback to apply on completion
 */
casper.checkStep = function checkStep(self, onComplete) {
    if (self.pendingWait || self.loadInProgress) {
        return;
    }
    self.current = self.step;                 // Added:  New Property.  self.current is current execution step pointer
    var step = self.steps[self.step++];
    if (utils.isFunction(step)) {
        self.runStep(step);
        step.executed = true;                 // Added:  This navigation step is executed already or not.
    } else {
        self.result.time = new Date().getTime() - self.startTime;
        self.log(f("Done %s steps in %dms", self.steps.length, self.result.time), "info");
        clearInterval(self.checker);
        self.emit('run.complete');
        if (utils.isFunction(onComplete)) {
            try {
                onComplete.call(self, self);
            } catch (err) {
                self.log("Could not complete final step: " + err, "error");
            }
        } else {
            // default behavior is to exit
            self.exit();
        }
    }
};


/**
 * Revised then() function for realizing label() and goto()
 * Every revised points are commented.
 *
 * @param  function  step  A function to be called as a step
 * @return Casper
 */
casper.then = function then(step) {
    if (!this.started) {
        throw new CasperError("Casper not started; please use Casper#start");
    }
    if (!utils.isFunction(step)) {
        throw new CasperError("You can only define a step as a function");
    }
    // check if casper is running
    if (this.checker === null) {
        // append step to the end of the queue
        step.level = 0;
        this.steps.push(step);
        step.executed = false;                 // Added:  New Property. This navigation step is executed already or not.
        this.emit('step.added', step);         // Moved:  from bottom
    } else {

      if( !this.steps[this.current].executed ) {  // Added:  Add step to this.steps only in the case of not being executed yet.
        // insert substep a level deeper
        try {
//          step.level = this.steps[this.step - 1].level + 1;   <=== Original
            step.level = this.steps[this.current].level + 1;   // Changed:  (this.step-1) is not always current navigation step
        } catch (e) {
            step.level = 0;
        }
        var insertIndex = this.step;
        while (this.steps[insertIndex] && step.level === this.steps[insertIndex].level) {
            insertIndex++;
        }
        this.steps.splice(insertIndex, 0, step);
        step.executed = false;                    // Added:  New Property. This navigation step is executed already or not.
        this.emit('step.added', step);            // Moved:  from bottom
      }                                           // Added:  End of if() that is added.

    }
//    this.emit('step.added', step);   // Move above. Because then() is not always adding step. only first execution time.
    return this;
};


/**
 * Adds a new navigation step by 'then()'  with naming label
 *
 * @param    String    labelname    Label name for naming execution step
 */
casper.label = function label( labelname ) {
  var step = new Function('"empty function for label: ' + labelname + ' "');   // make empty step
  step.label = labelname;                                 // Adds new property 'label' to the step for label naming
  this.then(step);                                        // Adds new step by then()
};

/**
 * Goto labeled navigation step
 *
 * @param    String    labelname    Label name for jumping navigation step
 */
casper.goto = function goto( labelname ) {
  for( var i=0; i<this.steps.length; i++ ){         // Search for label in steps array
      if( this.steps[i].label == labelname ) {      // found?
        this.step = i;                              // new step pointer is set
      }
  }
};
// End of Extending Casper functions for realizing label() and goto()
//================================================================================
//================================================================================



//================================================================================
//================================================================================
// Extending Casper functions for dumpSteps()

/**
 * Dump Navigation Steps for debugging
 * When you call this function, you cat get current all information about CasperJS Navigation Steps
 * This is compatible with label() and goto() functions already.
 *
 * @param   Boolen   showSource    showing the source code in the navigation step?
 *
 * All step No. display is (steps array index + 1),  in order to accord with logging [info] messages.
 *
 */
casper.dumpSteps = function dumpSteps( showSource ) {
  this.echo( "=========================== Dump Navigation Steps ==============================", "RED_BAR");
  if( this.current ){ this.echo( "Current step No. = " + (this.current+1) , "INFO"); }
  this.echo( "Next    step No. = " + (this.step+1) , "INFO");
  this.echo( "steps.length = " + this.steps.length , "INFO");
  this.echo( "================================================================================", "WARNING" );

  for( var i=0; i<this.steps.length; i++){
    var step  = this.steps[i];
    var msg   = "Step: " + (i+1) + "/" + this.steps.length + "     level: " + step.level
    if( step.executed ){ msg = msg + "     executed: " + step.executed }
    var color = "PARAMETER";
    if( step.label    ){ color="INFO"; msg = msg + "     label: " + step.label }

    if( i == this.current ) {
      this.echo( msg + "     <====== Current Navigation Step.", "COMMENT");
    } else {
      this.echo( msg, color );
    }
    if( showSource ) {
      this.echo( "--------------------------------------------------------------------------------" );
      this.echo( this.steps[i] );
      this.echo( "================================================================================", "WARNING" );
    }
  }
};

// End of Extending Casper functions for dumpSteps()
//================================================================================
//================================================================================


function removeEmptyElem(ary) {
    for (var i=ary.length;i>=0;i--) {
        if (ary[i] == undefined)  {
            ary.splice(i, 1);
        }       
    }
    return ary;
}


function getLinks() {
    var results = [];
    var pjresults = document.querySelectorAll('.visitCard');
    for (var i = 0; i < pjresults.length; i++) {
        if (pjresults[i].querySelector(".textPagespro")) {
            //var siren = decode_base64(eval("(" + pjresults[i].querySelector(".idTag_PAGESPRO").getAttribute('data-pjlienbrouille') + ")").url.replace("#", "")).split(/a_siren=(.*)&/)[1];
            // var siren = decode_base64(eval("(" + pjresults[i].querySelector(".idTag_PAGESPRO").getAttribute('data-pjlienbrouille') + ")").url.replace("#", "")).split(/a_siren=(.*)&/)[1];
            var siren = atob(eval("(" + pjresults[i].querySelector(".idTag_PAGESPRO").getAttribute('data-pjlienbrouille') + ")").url.replace("#", "")).split(/a_siren=(.*)&/)[1];
            results.push({
                'type': 'page_pro',
                //'page_pro_element_class': pjresults[i].querySelector(".textPagespro a").className,
                'pj_name': pjresults[i].querySelector("h2.titleMain>a>span:nth-of-type(1)").innerText,
                'pj_site': (function() {
                    if (pjresults[i].querySelector('.sitePro a')) {
                        return pjresults[i].querySelector('.sitePro a').innerHTML;
                    } else if (pjresults[i].querySelector('.lvsLink2 a')) {
                        return pjresults[i].querySelector('.lvsLink2 a').innerHTML;
                    }
                    return "";
                })(),
                'pj_tels': Array.prototype.map.call(pjresults[i].querySelectorAll(".contactBlock .hideTel strong span"), function(e) {
                    return e.innerHTML.replace("\.", "").replace(new RegExp(" ", "g"), "");
                }),
                'pj_adresse': pjresults[i].querySelector(".localisationBlock p").innerText.replace(new RegExp("\\n", "g"), " "),
                'pj_siret': siren
            });
        } else {
            results.push({
                'type': 'standard',
                'pj_name': pjresults[i].querySelector("h2.titleMain>a>span:nth-of-type(1)").innerText,
                'pj_site': (function() {
                    if (pjresults[i].querySelector('.sitePro a')) {
                        return pjresults[i].querySelector('.sitePro a').innerHTML;
                    } else if (pjresults[i].querySelector('.lvsLink2 a')) {
                        return pjresults[i].querySelector('.lvsLink2 a').innerHTML;
                    }
                    return "";
                })(),
                'pj_tels': Array.prototype.map.call(pjresults[i].querySelectorAll(".contactBlock .hideTel strong span"), function(e) {
                    return e.innerHTML.replace("\.", "").replace(new RegExp(" ", "g"), "");
                }),
                'pj_adresse': pjresults[i].querySelector(".localisationBlock p").innerText.replace(new RegExp("\\n", "g"), " "),
                'pj_siret': "-"
            });
        }
    }
    return results;
}

function getPagePro() {
    var siret = document.querySelectorAll('.results_data div')[1].innerText.replace(/\D/g,'');
    return siret;
}

casper.start();

var departments = new Array(51, 55, 59, 60, 62, 80);
var department = 0;
var i_dep = -1;
var current_page_links = [];
var current_page_pro_links = [];
var i_links = 0;
// var quoi = 'menuiserie bois';
// var quoi = 'agencement intérieur';
var quoi = "menuiserie d'agencement";


casper.then(function() {
    console.log("Nom;Siren;Site Web;Adresse;Télephones mobiles;Téléphones fixes;Requête effectuée (ou);Requête effectuée (quoi)");
});

casper.label( "LOOP_DEPARTEMENT" );   

    casper.thenOpen('http://www.pagesjaunes.fr/');

    casper.then(function() {
        i_dep = i_dep + 1;
        if (i_dep >= departments.length) {
            casper.goto( "END_LOOP_DEPARTEMENT" );
        }
        department = departments[i_dep];
        // console.log('[INFO] Location is ' + this.getCurrentUrl());
        // this.echo('======= Département : ' + department + ' =======');
    })


    casper.thenEvaluate(function(term, where) {
        document.querySelector('input[name="quoiqui"]').setAttribute('value', term);
        document.querySelector('input[name="ou"]').setAttribute('value', where);
  //          document.querySelector('input[name="idLieu"]').setAttribute('value', "C" + where);
        document.querySelector('input[name="portail"]').setAttribute('value', 'PJ');
//        document.querySelector('input[name="choixMultiLoc"]').setAttribute('value', 'true');
//        document.querySelector('input[name="choixAmbiguite"]').setAttribute('value', 'false');




        document.querySelector('form[name="formClassiqueHaut"]').submit();
    }, quoi, department);


    casper.label( "LOOP_START" );       

    casper.then(function() {
        // console.log('[INFO] Location is ' + this.getCurrentUrl());
    });

    casper.then(function() {
        // console.log('[INFO] Click on links');
        this.click('.picTel');
        //this.click('.textPagespro a');
    });

    // casper.thenEvaluate(function() {
    //     console.log('[INFO] Click on links');
    //     document.querySelectorAll('.picTel').click();
    //     document.querySelectorAll('.textPagespro a').click();
    // });
    
    casper.then(function() {
        // Click on 1st result link
        // this.click('h3.r a');
        //console.log('[INFO] Location is ' + this.getCurrentUrl());
        current_page_links = this.evaluate(getLinks);

        current_page_pro_links = Array.prototype.filter.call(current_page_links, function(e){
            return e.type == "page_pro";
        });
        // console.log(JSON.stringify(current_page_pro_links));
        // this.echo("[INFO] Page pro links = " + current_page_pro_links.length);
    });

    casper.then(function() {
        var csv_lines = Array.prototype.map.call(current_page_links, function(enterprise) {
            // console.log("ent : " + enterprise['pj_name']);
            return [
                enterprise['pj_name'],
                enterprise['pj_siret'],
                enterprise['pj_site'],
                enterprise['pj_adresse'],
                removeEmptyElem(enterprise['pj_tels'].map(function(tel) {
                    if (tel.match(new RegExp("^(06|07).*", "g"))) {
                        return tel;
                    }
                })).join(","),
                removeEmptyElem(enterprise['pj_tels'].filter(function(tel) {
                    if (!tel.match(new RegExp("^(06|07).*", "g"))) {
                        return tel;
                    }
                })).join(","),
                department,
                quoi
            ].join(";");
        });

        console.log(csv_lines.join("\n"));
    });


    // casper.label( "LOOP_LINKS" );

    // casper.then(function() {
    //     if (current_page_pro_links.length != 0 && i_links < current_page_pro_links.length) {
    //         this.echo("[INFO] Going to page pro : " + current_page_pro_links[i_links].page_pro_element_class);
    //         this.evaluate(function() {
    //             document.querySelector("." + current_page_pro_links[i_links].page_pro_element_class.replace(/ /g,".")).click();
    //         });
    //         var page_pro_infos = this.evaluate(getPagePro);
    //         this.echo("Siret = " + page_pro_infos);
    //         i_links = i_links + 1;
    //     } else {
    //         casper.goto( "LOOP_LINKS_END" );
    //     }
    // });

    // casper.then(function() {
    //     this.echo("[INFO] Location is " + this.getCurrentUrl());
    //     var page_pro_infos = this.evaluate(getPagePro);
    //     this.echo("Siret = " + page_pro_infos);
    // });

    // casper.then(function() {
    //     casper.goto( "LOOP_LINKS" );
    // });

    // casper.label( "LOOP_LINKS_END" );

    casper.then(function() {
        i_links = 0;

        if (this.exists('.linkNext ')) {
            // console.log('[INFO] Next Page Found');
            this.click('.linkNext a');
        } else {
            casper.goto( "LOOP_END" ); 
        }
    });

    casper.then(function() {                 // STEP:  Loop     *** NEED to put then() around goto()
        casper.goto( "LOOP_START" );         // unconditional jump for making infinite loop
    });

    casper.label( "LOOP_END" );  

    casper.then(function() {
        // this.echo('======= End of departement : ' + department + ' =======');
        // this.echo('========================================================');
        casper.goto( "LOOP_DEPARTEMENT" );    
    });

    casper.label( "END_LOOP_DEPARTEMENT" ); 

casper.run();



// function decode_base64(s) {
//     var e={},i,k,v=[],r='',w=String.fromCharCode;
//     var n=[[65,91],[97,123],[48,58],[43,44],[47,48]];

//     for(z in n){for(i=n[z][0];i<n[z][1];i++){v.push(w(i));}}
//     for(i=0;i<64;i++){e[v[i]]=i;}

//     for(i=0;i<s.length;i+=72){
//     var b=0,c,x,l=0,o=s.substring(i,i+72);
//          for(x=0;x<o.length;x++){
//                 c=e[o.charAt(x)];b=(b<<6)+c;l+=6;
//                 while(l>=8){r+=w((b>>>(l-=8))%256);}
//          }
//     }
//     return r;
//     }