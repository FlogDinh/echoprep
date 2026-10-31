(function(root){
 'use strict';
 const groups=[
  {id:'education',title:'Education',meaning:'Giáo dục và học tập',cards:[
   ['Study abroad','Du học','ˈstʌdi əˈbrɔːd'],
   ['Access higher-quality education','Tiếp cận nền giáo dục chất lượng cao hơn','ˈækses ˌhaɪə ˈkwɒləti ˌedʒʊˈkeɪʃən'],
   ['Gain access to education','Có cơ hội tiếp cận giáo dục','ɡeɪn ˈækses tə ˌedʒʊˈkeɪʃən'],
   ['Expand academic knowledge','Mở rộng kiến thức học thuật','ɪkˈspænd ˌækəˈdemɪk ˈnɒlɪdʒ'],
   ['Broaden academic knowledge','Mở rộng kiến thức học thuật','ˈbrɔːdən ˌækəˈdemɪk ˈnɒlɪdʒ'],
   ['Improve foreign language skills','Cải thiện kỹ năng ngoại ngữ','ɪmˈpruːv ˈfɒrən ˈlæŋɡwɪdʒ skɪlz'],
   ['Enhance language proficiency','Nâng cao năng lực ngôn ngữ','ɪnˈhɑːns ˈlæŋɡwɪdʒ prəˈfɪʃənsi'],
   ['A positive learning experience','Trải nghiệm học tập tích cực','ə ˈpɒzətɪv ˈlɜːnɪŋ ɪkˈspɪəriəns'],
   ['A rewarding educational experience','Trải nghiệm giáo dục bổ ích','ə rɪˈwɔːdɪŋ ˌedʒʊˈkeɪʃənəl ɪkˈspɪəriəns']
  ]},
  {id:'personal-development',title:'Personal development',meaning:'Phát triển bản thân',cards:[
   ['Become more independent','Trở nên độc lập hơn','bɪˈkʌm mɔː ˌɪndɪˈpendənt'],
   ['Develop greater independence','Phát triển tính tự lập','dɪˈveləp ˈɡreɪtər ˌɪndɪˈpendəns'],
   ['Develop essential soft skills','Phát triển kỹ năng mềm thiết yếu','dɪˈveləp ɪˈsenʃəl sɒft skɪlz'],
   ['Equip students with essential skills','Trang bị cho sinh viên kỹ năng thiết yếu','ɪˈkwɪp ˈstjuːdənts wɪð ɪˈsenʃəl skɪlz'],
   ['Prepare for future careers','Chuẩn bị cho sự nghiệp tương lai','prɪˈpeə fə ˈfjuːtʃə kəˈrɪəz'],
   ['Experience a new culture','Trải nghiệm nền văn hóa mới','ɪkˈspɪəriəns ə njuː ˈkʌltʃə'],
   ['Immerse oneself in a different culture','Hòa mình vào nền văn hóa khác','ɪˈmɜːs wʌnˈself ɪn ə ˈdɪfərənt ˈkʌltʃə'],
   ['Build friendships','Xây dựng tình bạn','bɪld ˈfrendʃɪps'],
   ['Make friends with people from different countries','Kết bạn với người đến từ nhiều quốc gia','meɪk frendz wɪð ˈpiːpəl frəm ˈdɪfərənt ˈkʌntriz']
  ]},
  {id:'challenges',title:'Challenges',meaning:'Khó khăn khi du học',cards:[
   ['Face difficulties','Đối mặt với khó khăn','feɪs ˈdɪfɪkəltiz'],
   ['Encounter difficulties','Gặp phải khó khăn','ɪnˈkaʊntə ˈdɪfɪkəltiz'],
   ['Face challenges','Đối mặt với thử thách','feɪs ˈtʃælɪndʒɪz'],
   ['Pose a significant challenge','Gây ra một thách thức lớn','pəʊz ə sɪɡˈnɪfɪkənt ˈtʃælɪndʒ'],
   ['Adapt to a new environment','Thích nghi với môi trường mới','əˈdæpt tə ə njuː ɪnˈvaɪrənmənt'],
   ['Adjust to new surroundings','Thích nghi với hoàn cảnh mới','əˈdʒʌst tə njuː səˈraʊndɪŋz'],
   ['Feel lonely','Cảm thấy cô đơn','fiːl ˈləʊnli'],
   ['Feel homesick','Cảm thấy nhớ nhà','fiːl ˈhəʊmsɪk'],
   ['Experience homesickness','Trải qua cảm giác nhớ nhà','ɪkˈspɪəriəns ˈhəʊmsɪknəs'],
   ['Feel isolated','Cảm thấy bị cô lập','fiːl ˈaɪsəleɪtɪd'],
   ['Overcome difficulties','Vượt qua khó khăn','ˌəʊvəˈkʌm ˈdɪfɪkəltiz']
  ]},
  {id:'financial-issues',title:'Financial issues',meaning:'Vấn đề tài chính',cards:[
   ['Tuition fees','Học phí','tjuˈɪʃən fiːz'],
   ['Living expenses','Chi phí sinh hoạt','ˈlɪvɪŋ ɪkˈspensɪz'],
   ['Accommodation costs','Chi phí chỗ ở','əˌkɒməˈdeɪʃən kɒsts'],
   ['Take on part-time jobs','Nhận công việc làm thêm','teɪk ɒn ˌpɑːt ˈtaɪm dʒɒbz'],
   ['Seek part-time employment','Tìm kiếm việc làm bán thời gian','siːk ˌpɑːt ˈtaɪm ɪmˈplɔɪmənt'],
   ['Cover living expenses','Trang trải chi phí sinh hoạt','ˈkʌvə ˈlɪvɪŋ ɪkˈspensɪz'],
   ['Ease the financial burden','Giảm bớt gánh nặng tài chính','iːz ðə faɪˈnænʃəl ˈbɜːdən'],
   ['Prepare financially','Chuẩn bị về tài chính','prɪˈpeə faɪˈnænʃəli'],
   ['Financial planning','Lập kế hoạch tài chính','faɪˈnænʃəl ˈplænɪŋ']
  ]},
  {id:'support-services',title:'Support services',meaning:'Dịch vụ hỗ trợ sinh viên',cards:[
   ['Provide support services','Cung cấp dịch vụ hỗ trợ','prəˈvaɪd səˈpɔːt ˈsɜːvɪsɪz'],
   ['Offer a range of support services','Cung cấp nhiều dịch vụ hỗ trợ','ˈɒfər ə reɪndʒ əv səˈpɔːt ˈsɜːvɪsɪz'],
   ['Organise orientation programmes','Tổ chức chương trình định hướng','ˈɔːɡənaɪz ˌɔːrienˈteɪʃən ˈprəʊɡræmz'],
   ['Offer psychological counselling services','Cung cấp dịch vụ tư vấn tâm lý','ˈɒfə ˌsaɪkəˈlɒdʒɪkəl ˈkaʊnsəlɪŋ ˈsɜːvɪsɪz'],
   ['Seek help','Tìm kiếm sự giúp đỡ','siːk help'],
   ['Actively seek help','Chủ động tìm kiếm sự giúp đỡ','ˈæktɪvli siːk help'],
   ['Proactively seek support','Chủ động tìm kiếm sự hỗ trợ','prəʊˈæktɪvli siːk səˈpɔːt'],
   ['Mental preparation','Sự chuẩn bị tinh thần','ˈmentəl ˌprepəˈreɪʃən'],
   ['Be mentally prepared','Có sự chuẩn bị về tinh thần','biː ˈmentəli prɪˈpeəd']
  ]},
  {id:'advantages-disadvantages',title:'Advantages and disadvantages',meaning:'Lợi ích và bất lợi',cards:[
   ['Offer many opportunities','Mang lại nhiều cơ hội','ˈɒfə ˈmeni ˌɒpəˈtjuːnətiz'],
   ['Provide students with opportunities','Mang đến cơ hội cho sinh viên','prəˈvaɪd ˈstjuːdənts wɪð ˌɒpəˈtjuːnətiz'],
   ['Offer numerous benefits','Mang lại nhiều lợi ích','ˈɒfə ˈnjuːmərəs ˈbenɪfɪts'],
   ['Outweigh the disadvantages','Có lợi ích lớn hơn bất lợi','ˌaʊtˈweɪ ðə ˌdɪsədˈvɑːntɪdʒɪz'],
   ['Far outweigh the drawbacks','Có lợi ích vượt trội so với hạn chế','fɑːr ˌaʊtˈweɪ ðə ˈdrɔːbæks'],
   ['A significant challenge','Một thách thức lớn','ə sɪɡˈnɪfɪkənt ˈtʃælɪndʒ'],
   ['A positive learning experience','Một trải nghiệm học tập tích cực','ə ˈpɒzətɪv ˈlɜːnɪŋ ɪkˈspɪəriəns']
  ]}
 ];
 const deck={id:'studying-abroad',title:'Studying Abroad',meaning:'Du học',groups:groups.map(group=>({...group,cards:group.cards.map(([english,meaning,ipa],i)=>({id:`${group.id}-${i+1}`,english,meaning,ipa:`/${ipa}/`,group:group.id}))}))};
 const data={types:[{id:'advantages-disadvantages',title:'Advantages & Disadvantages',topics:[deck]}]};
 if(typeof module==='object'&&module.exports)module.exports=data;else root.ECHO_COLLOCATIONS=data;
})(typeof window==='object'?window:globalThis);
