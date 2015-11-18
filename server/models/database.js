var pg = require('pg');
var path = require('path');
var _ = require('underscore');

var schema = 'evol_demo',
    dbuser = 'evol'; // 'postgres'

var uims={
    //-- apps
    'todo': require('../../client/public/ui-models/todo.js'),
    'contact': require('../../client/public/ui-models/contacts.js'),
    'winecellar': require('../../client/public/ui-models/winecellar.js'),
    'comics': require('../../client/public/ui-models/comics.js'),
    //'test': require('../../client/public/ui-models/test.js'),

    'todo_data': require('../../client/public/ui-models/todo.data.js'),
    'contact_data': require('../../client/public/ui-models/contacts.data.js'),
    'winecellar_data': require('../../client/public/ui-models/winecellar.data.js'),
    'comics_data': require('../../client/public/ui-models/comics.data.js')
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
    sql = 'CREATE TABLE '+t+'\n(\n' + fs.join(',\n') + ');\n';

    // -- insert sample data
    _.each(uims[uimid+'_data'], function(row){
        sql+='INSERT INTO '+t;
        var ns=[], vs=[];
        for(var p in row){
            var v=row[p];
            if(!_.isArray(v)){
                if(p!=='id'){
                    ns.push('"'+p+'"');
                    if(_.isString(v)){
                        v="'"+v.replace(/'/g, "''")+"'";
                    }
                    vs.push(v);
                }
            }
        }
        sql+='('+ns.join(',')+') values('+vs.join(',')+');\n';
    });
    console.log(sql);
    return sql;
}
var modelNames = ['todo', 'contact', 'winecellar', 'comics'];
var sql='';
if(schema){
    sql='CREATE SCHEMA '+schema+' AUTHORIZATION '+dbuser+';';
}
_.forEach(modelNames, function(uimid){
    sql+=uim2db(uimid);
});
console.log(sql);
var query = client.query(sql);
query.on('end', function() { client.end(); });
