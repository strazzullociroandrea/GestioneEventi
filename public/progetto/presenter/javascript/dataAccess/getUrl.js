export const getUrl = async (formData) => {
    let rsp = await fetch("/dammiUrl", {
        method: "POST",
        body: formData,
    });
    rsp = await rsp.json();
    return rsp.link;
}