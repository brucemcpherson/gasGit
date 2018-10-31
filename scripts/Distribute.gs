function dd () {
  var file = DriveApp.getFileById('M6Heerx1czXDLw7NL4S7pdKi_d-phDA33');
  Logger.log(file.getName());
}
/**
 * namespace Distribute
 * for distribution of script files
 */
var Distribute = (function (ns)  {
  
  // structure of useful things in info file
  // id - the id of the script file
  // libraries [{key:thelibkey}]
  return ns;
}) (Distribute || {})
