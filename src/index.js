const express = require('express'); 
const cors =require('cors');
const {uuidv4} = require('uuidv4');
const {execFileSync, execSync } = require('child_process');

const app = express();
//app.use(cors());
app.use(express.json()); 

const machines = []
let cloneNum = 0;

app.get('/machines', (request, response) =>{
    const {so} = request.query
    const results = so 
        ? machines.filter(machine => machine.so.includes(so))
        : machines;
    return response.json(results); 
}); 

app.post('/machines', (request, response) =>{
    const {so, cpu, memoria, ip} = request.body;
    const machine = {so, cpu, memoria, ip};
    machines.push(machine);
    console.log(request.body);
    if(so === 'linux'){

        execFileSync( 'VBoxManage', 
                    ['clonevm', 'linux', '--mode=machine', `--name=linux_${cloneNum}`, '--register']
        );
        console.log('clone');
        execFileSync('VBoxManage',
                    ['modifyvm', `linux_${cloneNum}`, '--memory', `${memoria}`, '--cpus', `${cpu}`]);
        console.log('memoria');
        const result = execFileSync('VBoxManage', 
                                    ['startvm', `linux_${cloneNum}`],
                                    {shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'} 
        ).toString();
        console.log('start');
        execFileSync('VBoxManage',
                    ['guestproperty',  'wait', `linux_${cloneNum}`, '/VirtualBox/GuestAdd/HostVerLastChecked'],
                    { shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'}
        );
        console.log('wait');
        const a = execFileSync('VBoxManage',
                    ['guestcontrol', `linux_${cloneNum}`, 'run', '--exe', '"/sbin/ifconfig"', '--username', 'root' ,'--password',  'senha', '--wait-stderr', '--wait-stdout' , '-- ', `ifconfig eth0 ${ip} netmask 255.255.255.0` ],
                    {shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'}
        );
        console.log('ip');
        console.log(cloneNum);
        cloneNum++;
        console.log(cloneNum);
        return (response.send(result));
    }else if(so === 'windows'){
        execFileSync( 'VBoxManage', 
                    ['clonevm', 'windows', '--mode=machine', `--name=windows_${cloneNum}`, '--register']
        );
    
        execFileSync('VBoxManage',
                    ['modifyvm', `windows_${cloneNum}`, '--memory', `${memoria}`, '--cpus', `${cpu}`]);

        const result = execFileSync('VBoxManage', 
                                    ['startvm', `windows_${cloneNum}`],
                                    {shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'} 
        ).toString();
        execFileSync('VBoxManage',
                    ['guestproperty',  'wait', `windows_${cloneNum}`, '/VirtualBox/GuestAdd/HostVerLastChecked'],
                    { shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'}
        );
        // Esse comando vai mudar por que tem que ser o do Windows
        execSync(`VBoxManage guestcontrol windows_${cloneNum} run --exe "C:\\windows\\system32\\cmd.exe" --username usuario --password senha -- cmd.exe/arg0 /C powershell "Start-Process -Verb RunAs cmd.exe '/c netsh interface ip set address name="Ethernet" static ${data.ip} 255.255.255.0 192.168.50.1'"`);
        console.log(cloneNum);
        cloneNum++;
        console.log(cloneNum);
        return (response.send(result));
    }

}); 
app.listen(3333, ()=>{
    console.log(' 🚀 Back-end started');
}); 