const map = new Set<number>()

function Timer(id: number, ms: number) {
    setTimeout(() => {
        console.log(id)
        Timer(id, ms)
    }, ms);
}


function exec(id: number) {
    if (map.has(id)) return
    map.add(id)
    Timer(id, 1000)
}

exec(1)
exec(2)