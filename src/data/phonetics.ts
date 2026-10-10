export const PHONETICS_ID = 'phonetics'
export const phoneticGroups = [
  { name: '长元音', entries: [['ɑː','car','汽车'],['ɔː','door','门'],['ɜː','bird','鸟'],['iː','see','看见'],['uː','food','食物']] },
  { name: '短元音', entries: [['ʌ','cup','杯子'],['ɒ','hot','热的'],['ə','about','关于'],['ɪ','sit','坐'],['ʊ','book','书'],['e','bed','床'],['æ','cat','猫']] },
  { name: '双元音', entries: [['eɪ','day','一天'],['aɪ','my','我的'],['ɔɪ','boy','男孩'],['əʊ','no','不'],['aʊ','now','现在'],['ɪə','here','这里'],['eə','hair','头发'],['ʊə','tour','旅行']] },
  { name: '清辅音', entries: [['p','pen','钢笔'],['t','tea','茶'],['k','cat','猫'],['f','fish','鱼'],['θ','think','思考'],['s','sun','太阳'],['ʃ','ship','船'],['tʃ','chair','椅子'],['ts','cats','猫（复数）'],['tr','tree','树'],['h','hat','帽子']] },
  { name: '浊辅音', entries: [['b','bag','包'],['d','dog','狗'],['ɡ','go','去'],['v','voice','声音'],['ð','this','这个'],['z','zoo','动物园'],['ʒ','measure','测量'],['dʒ','jump','跳'],['dz','beds','床（复数）'],['dr','drive','驾驶']] },
  { name: '鼻音', entries: [['m','man','男人'],['n','no','不'],['ŋ','sing','唱歌']] },
  { name: '/l/ 与 /r/', entries: [['l','leg','腿'],['r','read','阅读']] },
  { name: '半元音', entries: [['j','yes','是'],['w','water','水']] }
]
export const phoneticCount = phoneticGroups.reduce((sum, group) => sum + group.entries.length, 0)
