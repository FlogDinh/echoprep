(function(root){
 'use strict';
 const groups=[
  {id:'academic-life',title:'Academic life',meaning:'Học tập và thời gian nghỉ ngơi',cards:[
   ['Academic stress','Căng thẳng học tập','ˌækəˈdemɪk stres'],
   ['Experience academic stress','Trải qua căng thẳng học tập','ɪkˈspɪəriəns ˌækəˈdemɪk stres'],
   ['Get excellent scores','Đạt điểm số xuất sắc','ɡet ˈeksələnt skɔːz'],
   ['Get higher scores','Đạt điểm số cao hơn','ɡet ˈhaɪə skɔːz'],
   ['Attend extra classes','Tham gia các lớp học thêm','əˈtend ˈekstrə ˈklɑːsɪz'],
   ['A long school day','Một ngày học dài','ə lɒŋ skuːl deɪ'],
   ['Have enough time to rest','Có đủ thời gian để nghỉ ngơi','hæv ɪˈnʌf taɪm tə rest']
  ]},
  {id:'expectations-pressure',title:'Expectations & pressure',meaning:'Kỳ vọng và áp lực',cards:[
   ['High expectations','Những kỳ vọng cao','haɪ ˌekspekˈteɪʃənz'],
   ['Considerable pressure','Áp lực đáng kể','kənˈsɪdərəbəl ˈpreʃə'],
   ['Put someone under considerable pressure','Khiến ai đó chịu áp lực đáng kể','pʊt ˈsʌmwʌn ˈʌndə kənˈsɪdərəbəl ˈpreʃə']
  ]},
  {id:'competition-anxiety',title:'Competition & anxiety',meaning:'Cạnh tranh và lo âu',cards:[
   ['Intense competition','Sự cạnh tranh gay gắt','ɪnˈtens ˌkɒmpəˈtɪʃən'],
   ['Compete for a place at a prestigious university','Cạnh tranh để giành một suất tại trường đại học danh tiếng','kəmˈpiːt fər ə pleɪs ət ə presˈtɪdʒəs ˌjuːnɪˈvɜːsəti'],
   ['Compete for scholarships','Cạnh tranh để giành học bổng','kəmˈpiːt fə ˈskɒləʃɪps'],
   ['A prestigious university','Một trường đại học danh tiếng','ə presˈtɪdʒəs ˌjuːnɪˈvɜːsəti'],
   ['Feel anxious about the results','Cảm thấy lo lắng về kết quả','fiːl ˈæŋkʃəs əˈbaʊt ðə rɪˈzʌlts'],
   ['The results of the competition','Kết quả của cuộc cạnh tranh','ðə rɪˈzʌlts əv ðə ˌkɒmpəˈtɪʃən']
  ]},
  {id:'developing-reasons',title:'Developing reasons',meaning:'Diễn đạt nguyên nhân và mục đích',cards:[
   ['An increasing number of young people','Ngày càng có nhiều người trẻ','ən ɪnˈkriːsɪŋ ˈnʌmbər əv jʌŋ ˈpiːpəl'],
   ['One of the main reasons','Một trong những nguyên nhân chính','wʌn əv ðə meɪn ˈriːzənz'],
   ['Another significant reason','Một nguyên nhân đáng kể khác','əˈnʌðə sɪɡˈnɪfɪkənt ˈriːzən'],
   ['In order to get higher scores','Để đạt điểm số cao hơn','ɪn ˈɔːdə tə ɡet ˈhaɪə skɔːz']
  ]}
 ].map(group=>({...group,cards:group.cards.map(([english,meaning,ipa],i)=>({id:`academic-stress-${group.id}-${i+1}`,english,meaning,ipa:`/${ipa}/`,group:group.id}))}));
 groups.push({id:'grammar-practice',title:'Grammar practice',meaning:'Ngữ pháp cần luyện',cards:[
  {id:'academic-stress-grammar-1',group:'grammar-practice',kind:'grammar',english:'One of the + plural noun + is …',spokenText:'One of the main reasons is high expectations.',meaning:'Một trong những nguyên nhân chính là những kỳ vọng cao.',ipa:'/wʌn əv ðə meɪn ˈriːzənz ɪz haɪ ˌekspekˈteɪʃənz/',rule:'Sau “one of the” dùng danh từ số nhiều: reasons. Chủ ngữ chính là “one” (số ít), nên dùng “is”, không dùng “are”.',incorrectExample:'One of the main reason are high expectations.'},
  {id:'academic-stress-grammar-2',group:'grammar-practice',kind:'grammar',english:'Expect + somebody + to + V',spokenText:'Parents expect students to get excellent scores.',meaning:'Cha mẹ kỳ vọng học sinh đạt điểm số xuất sắc.',ipa:'/ˈpeərənts ɪkˈspekt ˈstjuːdənts tə ɡet ˈeksələnt skɔːz/',rule:'Dùng “expect + người + to + động từ nguyên mẫu”. Giữ “to” trước “get”; không dùng “expect students get”.',incorrectExample:'Parents expect students get excellent scores.'},
  {id:'academic-stress-grammar-3',group:'grammar-practice',kind:'grammar',english:'This + V(s/es)',spokenText:'This leads them to feel anxious.',meaning:'Điều này khiến họ cảm thấy lo lắng.',ipa:'/ðɪs liːdz ðəm tə fiːl ˈæŋkʃəs/',rule:'Ở thì hiện tại đơn, “this” là chủ ngữ số ít nên động từ thường thêm -s/-es: lead → leads.',incorrectExample:'This lead them to feel anxious.'}
 ]});
 const topic={id:'academic-stress',title:'Academic Stress',meaning:'Căng thẳng học tập',groups,grammarNote:'Ba cấu trúc trong đoạn bạn gửi đã được dùng đúng. Các câu sai trên thẻ chỉ là ví dụ minh hoạ để luyện tránh lỗi.'};
 const type={id:'causes-effects',title:'Causes & Effects',topics:[topic]};
 if(typeof module==='object'&&module.exports)module.exports=type;else root.ECHO_COLLOCATIONS.types.push(type);
})(typeof window==='object'?window:globalThis);
