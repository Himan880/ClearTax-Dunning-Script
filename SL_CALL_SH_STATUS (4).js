/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope SameAccount
*/
define(['N/ui/serverWidget', 'N/task'],
 
function (serverWidget, task) {
 
    function onRequest(context) {
 
        try {
			   
                var form = serverWidget.createForm({
                  title: 'Api Status',
                  hideNavBar : true 
                });
                
                // form.addSubmitButton({
                    // label: 'Submit'
                // });
 
                // var toDateParam = context.request.parameters.custpage_date;
				// log.debug('toDateParam', toDateParam);
 
                var mrTask = task.create({
					taskType: task.TaskType.SCHEDULED_SCRIPT,
					scriptId: 'customscript_api_status',
					deploymentId: 'customdeploy_api_status',
				});
                log.debug('mrTask', mrTask);
 
				var mrTaskId = mrTask.submit();
                log.debug('mrTaskId', mrTaskId);
                var suceess = form .addField({
                    id: 'custpage_inlinehtml',
                    label: 'Inlinehtml', 
                    type: serverWidget.FieldType.INLINEHTML
                })
              log.debug ('suceess',suceess);
                var myvar = '<html>' +
                    '  <head>' +
                    '    <link href="https://fonts.googleapis.com/css?family=Nunito+Sans:400,400i,700,900&display=swap" rel="stylesheet">' +
                    '  </head>' +
                    '    <style>' +
                    '      body {' +
                    '        text-align: center;' +
                    '        padding: 40px 0;' +
                    '        background: #EBF0F5;' +
                    '      }' +
                    '        h1 {' +
                    '          color: #88B04B;' +
                    '          font-family: "Nunito Sans", "Helvetica Neue", sans-serif;' +
                    '          font-weight: 900;' +
                    '          font-size: 40px;' +
                    '          margin-bottom: 10px;' +
                    '        }' +
                    '        p {' +
                    '          color: #404F5E;' +
                    '          font-family: "Nunito Sans", "Helvetica Neue", sans-serif;' +
                    '          font-size:20px;' +
                    '          margin: 0;' +
                    '        }' +
                    '      i {' +
                    '        color: #9ABC66;' +
                    '        font-size: 100px;' +
                    '        line-height: 200px;' +
                    '        margin-left:-15px;' +
                    '      }' +
                    '      .card {' +
                    '        background: white;' +
                    '        padding: 60px;' +
                    '        border-radius: 4px;' +
                    '        box-shadow: 0 2px 3px #C8D0D8;' +
                    '        display: inline-block;' +
                    '        margin: 0 auto;' +
                    '      }' +
                    '.clickme {' +
                    '    background-color: #20b2aa;' +
                    '    padding: 8px 20px;' +
                    '    text-decoration:none;' +
                    '    font-weight:bold;' +
                    '    border-radius:5px;' +
                    '    cursor:pointer;' +
                    '}' +
 
 
                    '    </style>' +
                    '    <body>' +
                    '      <div class="card">' +
                    '      <div style="border-radius:200px; height:100%; width:100%; background: #F8FAF5; margin:0 auto;">' +
                    '        <i class="checkmark" align="center" style="color:green;">&#10004;</i>' +
                    '      </div>' +
                    '        <h1>Success</h1> ' +
                    '        <p>Script is executed in backend , you will receive a notification shortly.</p>' +
                   '        <p><a href="https://8631258-sb1.app.netsuite.com/app/common/scripting/scriptstatus.nl?daterange=TODAY&datefrom=27%2F08%2F2024&dateto=27%2F08%2F2024&scripttype=1887&primarykey=&queueid=&jobstatefilterselect=unfinished&runtimeversion=&sortcol=dcreated&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&size=100&_csrf=3R4rlgdIfP2Ta6AGVwcfUKev2X9mnxp5sgj2IqM6zexf9GynI68H6NBa6visy2AqgRG7uyrveXo4TQIUE5Y9chQ5JF4DZTK7wMK6S9fDQ2EwGy_Gl1Mtw0VkoxsgjBDBseLHgPRJxtkJbMU9_6mtPAMifJccxwKoJ3UZRnXjkVg%3D&datemodi=WITHIN&date=TODAY" class="clickme">Click here to see the progress</a></p>' +
                    '      </div>' +
                    '    </body>' +
                    '</html>';
 
                log.debug("myvar", myvar)
                suceess.defaultValue = myvar
                context.response.writePage(form);
            
        }
 
        catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }

    }
    return {
        onRequest: onRequest
    };
});