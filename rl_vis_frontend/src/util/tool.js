

import axios from '../assets/http'

export function splitLinkName(name) {
    let arr = name.split(':')
    return arr.length !== 1 ? arr.slice(1).join('') : name
}
export function splitNodeName(name) {
    let arr = name.split('_')
    return arr.length !== 1 ? arr.slice(1).join('_') : name
}
export function findObjInArr(arr, key, val) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) {
            return arr[i]
        }
    }
    return null
}

export async function getSubGraph(triple, hop) {
    let result = null
    await axios.get("/get_sub_graph", {
        params: { ...triple, hop: hop }
    })
        .then(({ data }) => {
            if (data.state === 200 && data.data !== null) {
                result = buildKg(data.data, triple)
            } else {
                throw new Error("未查询到子图！")
            }
        })
        .catch(error => {
            throw new Error("查询数据失败！")
        })
    return result
}

function buildKg(graph, triple) {
    let map = new Map(),
        entitys = {}
    graph.links.forEach(link => {
        if (entitys[link.es_name]) {
            entitys[link.es_name].out.push({
                "rel_id": link.rel_id,
                "name": link.name,
                "target": link.target,
                "et_name": link.et_name
            })
        } else {
            entitys[link.es_name] = {
                "id": link.source,
                "name": link.es_name,
                "pos_inPath": link.path_order - 1,
                "out": [{
                    "rel_id": link.rel_id,
                    "name": link.name,
                    "target": link.target,
                    "et_name": link.et_name
                }],
                "enter": []
            }
        }
        if (entitys[link.et_name]) {
            entitys[link.et_name].enter.push({
                "rel_id": link.rel_id,
                "name": link.name,
                "source": link.source,
                "es_name": link.es_name
            })
        } else {
            entitys[link.et_name] = {
                "id": link.target,
                "name": link.et_name,
                "pos_inPath": link.path_order,
                "out": [],
                "enter": [{
                    "rel_id": link.rel_id,
                    "name": link.name,
                    "source": link.source,
                    "es_name": link.es_name
                }]
            }
        }
    })
    let count = 0
    for (let value of Object.values(entitys)) {
        let nodeType = JSON.stringify({ "out": value.out, "enter": value.enter })
        if (map.has(nodeType)) {
            let type_group = map.get(nodeType)
            value.type_id = type_group.id
            type_group.group.push(value)
            map.set(nodeType, type_group)
        } else {
            let type_id = `${entitys[triple.sourceEntity].id}-${entitys[triple.targetEntity].id}_${count++}`
            value.type_id = type_id
            map.set(nodeType, { "id": type_id, "group": [value], "pos_inPath": value.pos_inPath })
        }
    }
    for (let value of Object.values(entitys)) {
        let nodeType = JSON.stringify({ "out": value.out, "enter": value.enter })
        let type_group = map.get(nodeType)
        value.group_Num = type_group.group.length
    }
    let links = []
    for (let [key, value] of map.entries()) {
        let _key = JSON.parse(key)
        _key.out.forEach(link => {
            links.push({
                "id": `${value.id}-${link.rel_id}-${entitys[link.et_name].type_id}`,
                "rel_id": link.rel_id,
                "name": link.name,
                "source": value.id,
                "target": entitys[link.et_name].type_id
            })
        })
        _key.enter.forEach(link => {
            links.push({
                "id": `${entitys[link.es_name].type_id}-${link.rel_id}-${value.id}`,
                "rel_id": link.rel_id,
                "name": link.name,
                "source": entitys[link.es_name].type_id,
                "target": value.id,
            })
        })
    }
    let kgData = { "nodes": [...map.values()], "links": dataFilter(links) }
    return { entitys, kgData }
}

function dataFilter(data) {
    let map = new Map()
    return data.filter(item => {
        if (!map.has(item.id)) {
            map.set(item.id, item)
            return true
        } else {
            return false
        }
    })
}
