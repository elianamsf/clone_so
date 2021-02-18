const express = require('express'); 
const cors =require('cors');
const {uuidv4} = require('uuidv4');
const {execFileSync, execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json()); 

const machines = []

app.get('/machines', (request, response) =>{
    const {so} = request.query
    const results = so 
        ? machines.filter(machine => machine.so.includes(so))
        : machines;
    return response.json(results); 
}); 

app.post('/machines', (request, response) =>{
    const {so, cpu, memoria, nome, ip} = request.body;
    const machine = {so, cpu, memoria, ip};
    machines.push(machine);
    console.log(request.body);
    if(so === 'linux'){
        console.log('Linux');
        execFileSync( 'VBoxManage', 
                    ['clonevm', 'linux', '--mode=machine', `--name=linux_${nome}`, '--register']
        );
        console.log('Clone... Done');
        execFileSync('VBoxManage',
                    ['modifyvm', `linux_${nome}`, '--memory', `${memoria}`, '--cpus', `${cpu}`]);
        console.log('Memoria... Done');
        const result = execFileSync('VBoxManage', 
                                    ['startvm', `linux_${nome}`],
                                    {shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'} 
        ).toString();
        console.log('Start... Done');
        execFileSync('VBoxManage',
                    ['guestproperty', 'wait', `linux_${nome}`, '/VirtualBox/GuestAdd/HostVerLastChecked'],
                    { shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'}
        );
        console.log('Wait... Done');
        const a = execFileSync('VBoxManage',
                    ['guestcontrol', `linux_${nome}`, 'run', '--exe', '"/sbin/ifconfig"', '--username', 'root' ,'--password',  'senha', '--wait-stderr', '--wait-stdout' , '-- ', `ifconfig eth0 ${ip} netmask 255.255.255.0 up` ],
                    {shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'}
        );
        console.log('IP... Done');
        execFileSync('VBoxManage',
                    ['guestcontrol', `linux_${nome}`, 'run', '--exe', '"/sbin/route"', '--username', 'root' ,'--password',  'senha', '--wait-stderr', '--wait-stdout' , '-- ', `route add default gw 10.0.2.2 eth0` ],
                    {shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'}
        );
        console.log('Getway... Done');
        return (response.json(request.body));
    }else if(so === 'windows'){
        console.log('Windows');
        execFileSync( 'VBoxManage', 
                    ['clonevm', 'windows10', '--mode=machine', `--name=windows_${nome}`, '--register']
        );
        console.log('Clone... Done');
        execFileSync('VBoxManage',
                    ['modifyvm', `windows_${nome}`, '--memory', `${memoria}`, '--cpus', `${cpu}`]);
        console.log('Memoria... Done');
        const result = execFileSync('VBoxManage', 
                                    ['startvm', `windows_${nome}`],
                                    {shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'} 
        ).toString();
        console.log('Start... Done');
        execFileSync('VBoxManage',
                    ['guestproperty',  'wait', `windows_${nome}`, '/VirtualBox/GuestAdd/HostVerLastChecked'],
                    { shell :'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'}
        );
        console.log('Wait... Done');
        execSync(`VBoxManage guestcontrol windows_${nome} run --exe "C:\\windows\\system32\\cmd.exe" --username usuario --password senha -- cmd.exe/arg0 /C powershell "Start-Process -Verb RunAs cmd.exe '/c netsh interface ip set address name="Ethernet0" static ${ip} 255.255.255.0 10.0.2.2'`);
        console.log('IP... Done');
        return (response.json(request.body));
    }

}); 
app.listen(3333, ()=>{
    console.log(' 🚀 Back-end started');
}); 