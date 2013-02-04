prospection-prospection
=======================

## Installation

Install phantom.js and casper.js

Go to : 
		https://code.google.com/p/phantomjs/downloads/list

And Install Phantomjs :

		cd /usr/local/share
		sudo wget http://phantomjs.googlecode.com/files/phantomjs-1.8.1-linux-x86_64.tar.bz2
		sudo tar xjf phantomjs-1.8.1-linux-x86_64.tar.bz2
		sudo ln -s /usr/local/share/phantomjs-1.8.1-linux-x86_64/bin/phantomjs /usr/local/share/phantomjs
		sudo ln -s /usr/local/share/phantomjs-1.8.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs
		sudo ln -s /usr/local/share/phantomjs-1.8.1-linux-x86_64/bin/phantomjs /usr/bin/phantomjs

Then install Casper JS : 

		git clone git://github.com/n1k0/casperjs.git
		cd casperjs
		git checkout tags/1.0.1
		sudo ln -sf `pwd`/bin/casperjs /usr/local/bin/casperjs

Verify installation :

		phantomjs --version
		casperjs --version

## Run Script

    casperjs prospection.js
