var pg = require('pg');
var path = require('path');
var _ = require('underscore');

var schema = 'evol_demo';
//var dbuser = 'evol';
var dbuser = 'postgres';

var uims = {
    'todo': require('../../client/public/ui-models/todo.js'),
    'contact': require('../../client/public/ui-models/contacts.js'),
    'winecellar': require('../../client/public/ui-models/winecellar.js'),
    'comics': require('../../client/public/ui-models/comics.js'),
    'testCesc': require('../../client/public/ui-models/testCesc.js')
    //'test': require('../../client/public/ui-models/test.js'),
};
var uims_data = {
    'todo': require('../../client/public/ui-models/todo.data.js'),
    'contact': require('../../client/public/ui-models/contacts.data.js'),
    'winecellar': require('../../client/public/ui-models/winecellar.data.js'),
    'comics': require('../../client/public/ui-models/comics.data.js'),
    'testCesc_data': require('../../client/public/ui-models/testCesc.data.js')
};

var connectionString = require(path.join(__dirname, '../', '../', 'config'));

var client = new pg.Client(connectionString);
client.connect();

function getFields(uiModel, asObject){
    var fs=asObject?{}:[];
    function collectFields(te) {
        if (te && te.elements && te.elements.length > 0) {
            _.forEach(te.elements, function (te) {
                if(te.type!='panel-list'){
                    collectFields(te);
                }
            });
        } else {
            if(asObject){
                fs[te]=te;
            }else{
                fs.push(te);
            }
        }
    }
    collectFields(uiModel);
    return fs;
}

function uim2db(uimid){
    // -- generates SQL script to create a Postgres DB table for the ui model
    var uiModel = uims[uimid],
        t=schema+'.'+(uiModel.table || uiModel.id),
        fields=getFields(uiModel),
        fs=['id serial primary key'],
        sql0,
        sql;

    _.forEach(fields, function(f, idx){
        if(f.attribute!='id' && f.type!=='formula'){
            sql0=' "'+(f.attribute || f.id)+'" ';
            switch(f.type){
                case 'boolean':
                case 'integer':
                case 'json':
                case 'money':
                    sql0+=f.type;
                    break;
                case 'decimal': 
                    sql0+='double precision';
                    break;
                case 'date':
                case 'datetime':
                    sql0+='date';
                    break;
                case 'time': 
                    sql0+='time with time zone';
                    break;
                case 'list': 
                    sql0+='text[]';
                    break;
                default:
                    sql0+='text';
            }
            if(f.required){
                sql0+=' not null';
            }
            fs.push(sql0);
        }
    });

    //sql = 'CREATE SCHEMA "evol_demo" AUTHORIZATION evol;\n';
    //sql = 'DROP TABLE '+t+';\n'
    sql = 'CREATE TABLE '+t+'(\n' + fs.join(',\n') + ');\n';

    // -- insert sample data
    _.each(uims_data[uimid], function(row){
        sql+='INSERT INTO '+t;
        var ns=[], vs=[];
        for(var p in row){
            var v=row[p];
            if(!_.isArray(v) && p!=='id'){
                ns.push('"'+p+'"');
                if(_.isString(v)){
                    v="'"+v.replace(/'/g, "''")+"'";
                }
                vs.push(v);
            }
        }
        sql+='('+ns.join(',')+') values('+vs.join(',')+');\n';
    });
    console.log(sql);

    return sql;
}

var sql='';
if(schema){
    sql='DROP SCHEMA IF EXISTS '+schema+' CASCADE;\n'+
    sql='CREATE SCHEMA '+schema+' AUTHORIZATION '+dbuser+';\n';
}
for(var uimid in uims){
    sql+=uim2db(uimid);
}
console.log(sql);
var query = client.query(sql);
query.on('end', function() { client.end(); });
