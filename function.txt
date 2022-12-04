/* Function created by Mariella Butti v.1

Default code runs with MapBiomas Brazil. 
Another initiative migth be selected at the lines 49 to 54.

*/

exports.HabitatLoss = function(
                sp_name, 
                sp_area, 
                alt_ini, 
                alt_fin, 
                ano_ini, 
                ano_fin, 
                habitat, 
                scale, 
                folder_name, 
                results_format){
  /* Where:
  sp_name - string
  sp_area - polygon
  habitat - list
  alt_ini - integer
  alt_fin - integer
  ano_ini - integer between 1985 and 2020
  ano_fin - integer between 1985 and 2020
  scale - integer 
  folder_name - string
  results_format - "CSV" or "SHP"
 */

//////////////////////////////////////
/////////////// CODE /////////////////
//////////////////////////////////////

// Create ee.FeatureCollection
//Criar objeto do tipo ee.FeatureCollection
 sp_area = ee.FeatureCollection(sp_area)

// Create ee.List
//Criar objeto do tipo ee.List
 habitat = ee.List(habitat)

// Select SRTM altitudinal range
//Selecionar a amplitude altimétrica da base SRTM
var srtm = ee.Image("CGIAR/SRTM90_V4");
	srtm = srtm.expression("b(0) <" + alt_fin + " & b(0) >" +  alt_ini + "? 1 : 0")
               .clip(sp_area)


// Call Mapbiomas collection - select the iniciative by comment/uncomment the line
//Chamar coleção do Mapbiomas
var mapbiomas = ee.Image("projects/mapbiomas-workspace/public/collection6/mapbiomas_collection60_integration_v1") // Brazil 1985-2020 - Collection 6.0 - Legend code  
//var mapbiomas = ee.Image("projects/mapbiomas-raisg/public/collection3/mapbiomas_raisg_panamazonia_collection3_integration_v2") // Panamazonia 1985-2020 - Colection 3.0 - Legend code https://s3.amazonaws.com/amazonia.mapbiomas.org/leyenda/C%C3%B3digo_de_la_Leyenda_-_colecci%C3%B3n_3.pdf
//var mapbiomas = ee.Image("projects/mapbiomas-chaco/public/collection2/mapbiomas_chaco_collection2_integration_v1") // Chaco - Collection 2.0 - Legend code   https://mapbiomas-br-site.s3.amazonaws.com/Legenda/leyenda_mbchaco_col2_detallada__ES_.pdf
//var mapbiomas = ee.Image("projects/MapBiomas_Pampa/public/collection1/mapbiomas_pampa_collection1_integration_v1") // Pampa 2000-2019 - Collection 1.0 - Legend code https://mapbiomas-tri-pampa-site.s3.amazonaws.com/_ENG__Legend_Codes_Collection_1_PAMPA.pdf
//var mapbiomas = ee.Image("projects/mapbiomas_af_trinacional/public/collection1/mapbiomas_atlantic_forest_collection1_integration_v1") // Atlantic Forest 2000-2019 - Collection 1.0 - Legend code https://mapbiomas-tri-mataatlantica-site.s3.amazonaws.com/LEGEND_CODES-AF.pdf
//var mapbiomas = ee.Image("projects/mapbiomas-indonesia/public/collection1/post_Integration_filter_rev_2_10_3") //Indonesia 2000-2019 - Colection 1.0 - Legend code: https://mapbiomas.nusantara.earth/assets/files/Kode%20Legenda%20-%20Legend%20Code.pdf
                .clip(sp_area); 

// Select Mapbiomas data for each year and mask within specified elevation range
//Selecionar os rasters de acordo com os anos e criar uma image collection apenas com os anos da janela de analise e apenas do range altimetrico selecionado
var ini= mapbiomas.select("classification_"+ ano_ini)
                  .updateMask(srtm);

var fim = mapbiomas.select("classification_"+ ano_fin)
                   .updateMask(srtm);

// Remap habitat and non-habitat values to 1 and 0
//Reclassificar as imagens para os valores de 0-1 em classes de habitat/nao-habitat
var remapped_ini= ini.remap(habitat,ee.List.repeat(1,habitat.length()),0);
var remapped_fin = fim.remap(habitat,ee.List.repeat(1,habitat.length()),0);


// Calculate last year habitat area in square kilometers
//Calcular área final de habitat em km2
var areafim = remapped_fin.multiply(ee.Image.pixelArea());
 areafim = areafim.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: sp_area,
  scale:scale, //Set to 2000 to AOO calculations
  maxPixels:1e16
});

// Calculate first year area in square kilometers
//Calcular área inicial de habitat em km2
var areaini = remapped_ini.multiply(ee.Image.pixelArea());
 areaini = areaini.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: sp_area,
  scale:scale,
  maxPixels:1e16
});

// Calculate loss percentage
//Calcula a porcentagem de perda de área
var loss_perc = ee.Number(ee.Number(1).subtract(ee.Number(areafim.get('remapped')).divide(ee.Number(areaini.get('remapped'))))).multiply(ee.Number(100));

// Create results Object
//Cria um objeto para receber todos os resultados
var results = ee.Dictionary.fromLists({keys:
                                        ["Species",
                                        "Scale",
                                        "First_year",
                                        "Last_year",
                                        "Lower_elev",
                                        "Higher_elev",
                                        "Habitat_classes",
                                        "FY_sqkm",
                                        "LY_sqkm",
                                        "Perc_loss"],
                                        values: 
                                          [sp_name,
                                          scale+" meters",
                                          ano_ini,
                                          ano_fin,
                                          alt_ini,
                                          alt_fin,
                                          ee.String.encodeJSON(habitat),
                                          ee.Number(areaini.get('remapped')).divide(1e6),
                                          ee.Number(areafim.get('remapped')).divide(1e6),
                                          ee.Number(loss_perc)]})


// Print summary results
//Mostrar resultados no console
print("Habitat Loss", results)

//Plot maps//

// First Year Habitat Classification Map
//habitat no primeiro ano
Map.addLayer(remapped_ini,{palette:["ffffff","ffb40c"]},"First Year habitat")

// Last Year Habitat Classification Map
//habitat no último ano
Map.addLayer(remapped_fin,{palette:["ffffff","a90505"]},"Last Year habitat")

// Elevation selected range
//Elevação adequada
Map.addLayer(srtm,{palette:["ffffff","893fff"]},"Elevation selected");

//Exports//

// Export FY map as rasters 
//Exportar mapa do ano inicial
Export.image.toDrive({image:remapped_ini, 
                      description:sp_name+"First_year_habitat", 
                      folder:sp_name, 
                      fileNamePrefix: sp_name+ano_ini, 
                      region:sp_area, 
                      scale:scale, //Set to 2000 to AOO calculations
                      maxPixels: 1e13});
                      
// Export LY map as rasters 
//Exportar mapa do ano final
Export.image.toDrive({image:remapped_fin, 
                      description:sp_name+"Last_year_habitat", 
                      folder:sp_name, 
                      fileNamePrefix: sp_name+ano_fin, 
                      region: sp_area, 
                      scale:scale, //Set to 2000 to AOO calculations
                      maxPixels: 1e13});

// Export results table as CSV or SHP 
//Exportar tabela de resultados em formato CSV ou SHP
Export.table.toDrive({collection: ee.FeatureCollection([ee.Feature(sp_area.geometry(),results)]),
                      description: sp_name+"habitat_results", 
                      folder:sp_name, 
                      fileNamePrefix: "Habitat_"+sp_name, 
                      fileFormat: results_format
                      })

return(results, remapped_ini, remapped_fin, srtm)

} //END//

/////////////////////////////////////////////////////////////////////////////////////////////////////////////