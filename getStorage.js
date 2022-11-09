(function() {
    let i=0,key,value,store;
    let ret = [];
    for (i=0;i<localStorage.length;i++) {
            store = 'Local';
            key = localStorage.key(i);
            try {
                value = JSON.parse(localStorage.getItem(key));
                value = JSON.stringify(value,null,1);
            }catch(e){
                value = localStorage.getItem(key);
            }
            ret.push({store, key,value});
    }
    for (i=0;i<sessionStorage.length;i++) {
            store = 'Session';
            key = sessionStorage.key(i);
            try {
                value = JSON.parse(sessionStorage.getItem(key));
                value = JSON.stringify(value,null,1);
            }catch(e){
                value = sessionStorage.getItem(key);
            }
            ret.push({store, key,value});
    }
    return ret;
})();
