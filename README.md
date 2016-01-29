# STH Graphs examples
### Description
These are some examples of how to visualize data stored in [Fiware Sth-Comet](https://github.com/telefonicaid/fiware-sth-comet).

The Short Time Historic (STH, aka. Comet) is a component of the [FIWARE](https://www.fiware.org/) ecosystem
in charge of providing aggregated time series information about the evolution in
time of entity attribute values registered using the
<a href="http://catalogue.fiware.org/enablers/publishsubscribe-context-broker-orion-context-broker" target="_blank">Orion Context Broker</a>,
an implementation of the publish/subscribe context management system exposing NGSI9 and
<a href="http://technical.openmobilealliance.org/Technical/technical-information/release-program/current-releases/ngsi-v1-0">NGSI10</a> interfaces.

The STH component exposes an HTTP REST API to let external clients query the raw events (aka. raw data) from which the aggregated time series information is generated
or the aggregated time series information itself. To know more about the format of these two queries visit
[Fiware Sth-Comet](https://github.com/telefonicaid/fiware-sth-comet/blob/master/README.md#-consuming-raw-data).

These examples are built on top of [D3.js](http://d3js.org/), a JavaScript library for manipulating documents based on data using HTML, SVG, and CSS.
This library is advanced, so, for simplicity, these examples use [NVD3](http://nvd3.org/) that provides a set of
reusable and customizable components. To see all the components available visit [NVD3 examples](http://nvd3.org/examples/index.html)

### Dependencies
* npm
* bower

## Install
Clone this repository:
```
git clone https://github.com/telefonicaid/fiware-sth-graphs.git
```
Go to the downloaded folder
```
cd fiware-sth-graps
```
Install the dependencies:
```
bower install
```
## The examples
* Simple example using JQuery that draws [numerical raw data](examples/jquery/rawNumericalAttr)
* Extended example using AngularJS that draws qualitative aggregated data. It shows some examples of how to customize NVD3 components
to adapt them to concrete needs. It uses [angular-nvd3](http://krispo.github.io/angular-nvd3/), an AngularJS directive for NVD3 that allows
 customizing charts via JSON API. (coming soon).

## Run examples
* Open the desired HTML file in your browser to see a representation of the local data available in the corresponding samples.js file.
