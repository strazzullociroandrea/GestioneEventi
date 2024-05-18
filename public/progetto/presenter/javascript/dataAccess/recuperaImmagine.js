export const recuperaImmagine = async(evento) =>{
    let rspImg = await fetch("/download", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mega: evento.immagine })
    });
    rspImg = await rspImg.blob();
    return URL.createObjectURL(rspImg);
}