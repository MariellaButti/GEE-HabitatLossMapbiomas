/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-53.335545338533954, -4.8040161094306315],
          [-53.335545338533954, -6.378470044154156],
          [-51.489842213533954, -6.378470044154156],
          [-51.489842213533954, -4.8040161094306315]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/**
 * @description
 *    Calculates and compares two years habitat areas from classes id, time window, elevation range and especies distribution polygon
 * @author
 *    Mariella Butti
 */

// Create the variables
var sp_name = "Sp_especies" /// Species name - without spaces
var alt_ini = -1000 // lower altitude of the species distribution
var alt_fin = 3000 // higher altitude of the species distribution
var ano_ini = 1985 // fist year - starts in 1985
var ano_fin = 2020 // last year - until 2020
var scale = 30 // spatial scale in meters
var habitat = [3] // legend code according to https://mapbiomas-br-site.s3.amazonaws.com/_PT-BR__C%C3%B3digos_da_legenda_Cole%C3%A7%C3%A3o_6.pdf
var folder_name = sp_name+scale
var results_format= "CSV"

// Create AOI from draw or from asset
var shape = ee.FeatureCollection(geometry); // distribution area from map polygon
Map.addLayer(shape, {},  "distribution area")
Map.centerObject(shape)

// Call the function from another script
var funcoes = require("users/maributti/HabitatMammalsBR:function.js")

/// Running functions
var teste = funcoes.HabitatLoss(
                sp_name,
                shape,
                alt_ini,
                alt_fin,
                ano_ini,
                ano_fin,
                habitat,
                scale,
                folder_name,
                results_format
                )

///////////////////////////////////////////END