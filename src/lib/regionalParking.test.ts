import { describe, expect, it } from 'vitest'
import { mergeParkingAreas } from './regionalParking'
import type { CarPark } from '../types'

const area=(id:string,address_text:string,lat=-37.8083):CarPark=>({id,address_text,lat,lng:144.9567,distance_m:0,suburb:null,capacity:null,census_year:null,kind:'area'})
describe('current operator facilities and census fallback',()=>{
  it('replaces a reviewed historic alias without carrying its old capacity into the operator record',()=>{
    const operator={...area('qvm','Queen Victoria Market · Open Air Car Park'),census_aliases:['Old market car park']}
    const census={...area('census','Old market car park'),census_year:2024,capacity:564}
    const other=area('nearby','Different car park')
    expect(mergeParkingAreas([census,other],[operator]).map(r=>r.id)).toEqual(['nearby','qvm'])
    expect(operator.capacity).toBeNull()
    expect(mergeParkingAreas([census],[])).toEqual([census])
  })
  it('retains similarly named and displaced areas without an exact reviewed match',()=>{
    const operator={...area('qvm','Market'),census_aliases:['Old market car park']}
    const displaced={...area('far','Old market car park',-37.8183),census_year:2024}
    const other={...area('other','Old market car park north'),census_year:2024}
    expect(mergeParkingAreas([displaced,other],[operator])).toHaveLength(3)
  })
})
