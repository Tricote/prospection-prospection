var casper = require('casper').create();

function getLinks() {
    var links = document.querySelectorAll('h2.titleMain>a>span:nth-of-type(1)');
    return Array.prototype.map.call(links, function(e) {
        return e.innerHTML;
    });
}

casper.start();

var departments = new Array(25, 52, 54, 57, 67, 68, 70, 88, 90);
casper.each(departments, function(self, department) {

    this.then(function() {
        this.echo('======= Département : ' + department + ' =======');
    })

    this.thenOpen('http://www.pagesjaunes.fr/');

    this.then(function() {
        console.log('[INFO] Location is ' + this.getCurrentUrl());
    });


    this.thenEvaluate(function(term, where) {
        document.querySelector('input[name="quoiqui"]').setAttribute('value', term);
        document.querySelector('input[name="ou"]').setAttribute('value', where);
  //          document.querySelector('input[name="idLieu"]').setAttribute('value', "C" + where);
        document.querySelector('input[name="portail"]').setAttribute('value', 'PJ');
//        document.querySelector('input[name="choixMultiLoc"]').setAttribute('value', 'true');
//        document.querySelector('input[name="choixAmbiguite"]').setAttribute('value', 'false');




        document.querySelector('form[name="formClassiqueHaut"]').submit();
    }, 'menuiserie bois', department);

    this.then(function() {
        console.log('[INFO] Location is ' + this.getCurrentUrl());
    });

    this.then(function() {
        // Click on 1st result link
        // this.click('h3.r a');
        links = this.evaluate(getLinks);
        this.echo(' - ' + links.join('\n - '));
    });

    if (this.exists('.linkNext ') {
        console.log('[INFO] Next Page Found');
        this.click('.linkNext a');
    }

})




casper.run();