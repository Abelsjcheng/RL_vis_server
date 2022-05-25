

import axios from '../assets/http'

export function splitLinkName(name) {
    let arr = name.split(':')
    return arr.length !== 1 ? arr.slice(1).join('') : name
}
export function splitNodeName(name) {
    let arr = name.split('_')
    return arr.length !== 1 ? arr.slice(1).join('_') : name
}

export async function getSubGraph(triple, hop) {
    let result = null
    await axios.get("/get_sub_graph", {
        params: { ...triple, hop: hop }
    })
        .then(({ data }) => {
            if (data.state === 200 && data.data !== null) {
                result = data.data
            } else {
                throw new Error("未查询到子图！")
            }
        })
        .catch(error => {
            throw new Error("查询数据失败！")
        })
    return result
}
