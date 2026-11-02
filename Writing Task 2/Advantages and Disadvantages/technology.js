(function(root){
 'use strict';
 const groups=[
  {id:'describe-technology',title:'Describe technology',meaning:'Miêu tả công nghệ',cards:[
   ['cutting-edge technology','Công nghệ tiên tiến hàng đầu','ˌkʌtɪŋ ˈedʒ tekˈnɒlədʒi'],
   ['state-of-the-art devices','Các thiết bị hiện đại bậc nhất','ˌsteɪt əv ði ˈɑːt dɪˈvaɪsɪz'],
   ['user-friendly interface','Giao diện thân thiện, dễ sử dụng','ˌjuːzə ˈfrendli ˈɪntəfeɪs'],
   ['innovative digital tools','Các công cụ kỹ thuật số mang tính đổi mới','ˈɪnəvətɪv ˈdɪdʒɪtəl tuːlz'],
   ['time-saving applications','Các ứng dụng tiết kiệm thời gian','ˈtaɪm ˌseɪvɪŋ ˌæplɪˈkeɪʃənz'],
   ['reliable internet connection','Kết nối Internet ổn định, đáng tin cậy','rɪˈlaɪəbəl ˈɪntənet kəˈnekʃən'],
   ['outdated software systems','Các hệ thống phần mềm lỗi thời','ˌaʊtˈdeɪtɪd ˈsɒftweə ˈsɪstəmz'],
   ['addictive social media platforms','Các nền tảng mạng xã hội dễ gây nghiện','əˈdɪktɪv ˈsəʊʃəl ˈmiːdiə ˈplætfɔːmz']
  ]},
  {id:'verbs-actions',title:'Verbs and actions',meaning:'Động từ và hoạt động',cards:[
   ['surf the internet','Lướt Internet','sɜːf ði ˈɪntənet'],
   ['scroll through social media','Lướt xem nội dung trên mạng xã hội','skrəʊl θruː ˈsəʊʃəl ˈmiːdiə'],
   ['scroll through my news feeds','Lướt xem các bảng tin của mình','skrəʊl θruː maɪ njuːz fiːdz'],
   ['stream movies and TV shows','Xem phim và chương trình truyền hình trực tuyến','striːm ˈmuːviz ənd ˌtiːˈviː ʃəʊz'],
   ['stay connected with others','Giữ liên lạc với người khác','steɪ kəˈnektɪd wɪð ˈʌðəz'],
   ['send instant messages','Gửi tin nhắn tức thời','send ˈɪnstənt ˈmesɪdʒɪz'],
   ['react to posts','Bày tỏ cảm xúc với các bài đăng','riˈækt tə pəʊsts'],
   ['leave a comment','Để lại bình luận','liːv ə ˈkɒment'],
   ['access online learning resources','Truy cập các tài nguyên học tập trực tuyến','ˈækses ˌɒnˈlaɪn ˈlɜːnɪŋ rɪˈzɔːsɪz'],
   ['work remotely','Làm việc từ xa','wɜːk rɪˈməʊtli'],
   ['keep up with current events','Cập nhật các sự kiện thời sự','kiːp ʌp wɪð ˈkʌrənt ɪˈvents'],
   ['shop online','Mua sắm trực tuyến','ʃɒp ˌɒnˈlaɪn'],
   ['make online payments','Thực hiện thanh toán trực tuyến','meɪk ˌɒnˈlaɪn ˈpeɪmənts'],
   ['improve quality of life','Cải thiện chất lượng cuộc sống','ɪmˈpruːv ˈkwɒləti əv laɪf']
  ]},
  {id:'technology-nouns',title:'Nouns',meaning:'Danh từ và cụm danh từ',cards:[
   ['technological advancement','Sự tiến bộ về công nghệ','ˌteknəˈlɒdʒɪkəl ədˈvɑːnsmənt'],
   ['technological breakthrough','Bước đột phá về công nghệ','ˌteknəˈlɒdʒɪkəl ˈbreɪkθruː'],
   ['digital devices','Các thiết bị kỹ thuật số','ˈdɪdʒɪtəl dɪˈvaɪsɪz'],
   ['household appliances','Các thiết bị gia dụng','ˈhaʊshəʊld əˈplaɪənsɪz'],
   ['AI-powered tools','Các công cụ ứng dụng trí tuệ nhân tạo','ˌeɪ ˈaɪ ˌpaʊəd tuːlz'],
   ['automated machinery','Máy móc tự động hóa','ˈɔːtəmeɪtɪd məˈʃiːnəri'],
   ['robotic technology','Công nghệ robot','rəʊˈbɒtɪk tekˈnɒlədʒi']
  ]},
  {id:'technology-benefits',title:'Benefits',meaning:'Lợi ích của công nghệ',cards:[
   ['improve work efficiency','Nâng cao hiệu quả công việc','ɪmˈpruːv wɜːk ɪˈfɪʃənsi'],
   ['enhance communication','Cải thiện giao tiếp','ɪnˈhɑːns kəˌmjuːnɪˈkeɪʃən'],
   ['boost productivity','Nâng cao năng suất','buːst ˌprɒdʌkˈtɪvəti'],
   ['improve quality of life','Cải thiện chất lượng cuộc sống','ɪmˈpruːv ˈkwɒləti əv laɪf',{sourceEnglish:'improve life quality',spokenText:'improve quality of life',rule:'Ảnh ghi “improve life quality”. Thẻ dùng cách diễn đạt thông dụng, tự nhiên hơn là “improve quality of life”. Cụm này cũng có trong nhóm Verbs and actions; được giữ ở cả hai nhóm để ôn theo ngữ cảnh.'}],
   ['facilitate online learning','Tạo điều kiện thuận lợi cho việc học trực tuyến','fəˈsɪlɪteɪt ˌɒnˈlaɪn ˈlɜːnɪŋ'],
   ['automate repetitive tasks','Tự động hóa các công việc lặp đi lặp lại','ˈɔːtəmeɪt rɪˈpetətɪv tɑːsks'],
   ['save considerable time','Tiết kiệm đáng kể thời gian','seɪv kənˈsɪdərəbəl taɪm'],
   ['provide instant access to information','Cung cấp khả năng tiếp cận thông tin tức thì','prəˈvaɪd ˈɪnstənt ˈækses tə ˌɪnfəˈmeɪʃən'],
   ['simplify people’s lives','Đơn giản hóa cuộc sống của mọi người','ˈsɪmplɪfaɪ ˈpiːpəlz laɪvz'],
   ['overcome geographical barriers','Vượt qua các rào cản địa lý','ˌəʊvəˈkʌm ˌdʒiːəˈɡræfɪkəl ˈbæriəz',{sourceEnglish:'bridge geographical barriers',spokenText:'overcome geographical barriers',rule:'Ảnh ghi “bridge geographical barriers”. Thẻ ưu tiên “overcome geographical barriers”; cũng có thể dùng “break down geographical barriers”. “Bridge” thường đi với “gaps” hoặc “differences”.'}]
  ]},
  {id:'technology-drawbacks',title:'Drawbacks',meaning:'Bất lợi của công nghệ',cards:[
   ['become overly dependent on technology','Trở nên quá phụ thuộc vào công nghệ','bɪˈkʌm ˈəʊvəli dɪˈpendənt ɒn tekˈnɒlədʒi',{sourceEnglish:'become overly dependent to technology',spokenText:'become overly dependent on technology',rule:'Dùng “dependent on + N”, không dùng “dependent to” khi nói phụ thuộc vào điều gì. Cụm trong ảnh được sửa giới từ thành “on”.',incorrectExample:'become overly dependent to technology'}],
   ['suffer from phone addiction','Mắc chứng nghiện điện thoại','ˈsʌfə frəm fəʊn əˈdɪkʃən'],
   ['reduce face-to-face interaction','Giảm tương tác trực tiếp','rɪˈdjuːs ˌfeɪs tə ˈfeɪs ˌɪntərˈækʃən'],
   ['spread misinformation rapidly','Lan truyền thông tin sai lệch nhanh chóng','spred ˌmɪsɪnfəˈmeɪʃən ˈræpɪdli'],
   ['pose cybersecurity risks','Gây ra các rủi ro về an ninh mạng','pəʊz ˌsaɪbəsɪˈkjʊərəti rɪsks'],
   ['invade personal privacy','Xâm phạm quyền riêng tư cá nhân','ɪnˈveɪd ˈpɜːsənəl ˈprɪvəsi'],
   ['negatively affect mental health','Ảnh hưởng tiêu cực đến sức khỏe tinh thần','ˈneɡətɪvli əˈfekt ˈmentəl helθ'],
   ['encourage a sedentary lifestyle','Thúc đẩy lối sống ít vận động','ɪnˈkʌrɪdʒ ə ˈsedəntri ˈlaɪfstaɪl'],
   ['distract people from their work or studies','Khiến mọi người xao nhãng công việc hoặc việc học','dɪˈstrækt ˈpiːpəl frəm ðeə wɜːk ɔː ˈstʌdiz']
  ]},
  {id:'technology-solutions',title:'Solutions',meaning:'Giải pháp cho các vấn đề liên quan đến công nghệ',cards:[
   ['limit screen time','Hạn chế thời gian sử dụng màn hình','ˈlɪmɪt skriːn taɪm'],
   ['reduce reliance on technology','Giảm sự phụ thuộc vào công nghệ','rɪˈdjuːs rɪˈlaɪəns ɒn tekˈnɒlədʒi'],
   ['take regular breaks from the phone','Thường xuyên tạm ngừng sử dụng điện thoại','teɪk ˈreɡjələ breɪks frəm ðə fəʊn'],
   ['protect personal data','Bảo vệ dữ liệu cá nhân','prəˈtekt ˈpɜːsənəl ˈdeɪtə'],
   ['enhance online security','Tăng cường bảo mật trực tuyến','ɪnˈhɑːns ˌɒnˈlaɪn sɪˈkjʊərəti'],
   ['encourage face-to-face interaction','Khuyến khích tương tác trực tiếp','ɪnˈkʌrɪdʒ ˌfeɪs tə ˈfeɪs ˌɪntərˈækʃən'],
   ['verify information before sharing it','Xác minh thông tin trước khi chia sẻ','ˈverɪfaɪ ˌɪnfəˈmeɪʃən bɪˈfɔː ˈʃeərɪŋ ɪt'],
   ['establish clear regulations','Thiết lập các quy định rõ ràng','ɪˈstæblɪʃ klɪə ˌreɡjəˈleɪʃənz'],
   ['provide digital literacy education','Trang bị kiến thức và kỹ năng số','prəˈvaɪd ˈdɪdʒɪtəl ˈlɪtərəsi ˌedʒʊˈkeɪʃən'],
   ['tackle cybercrime effectively','Xử lý hiệu quả vấn đề tội phạm mạng','ˈtækəl ˈsaɪbəkraɪm ɪˈfektɪvli']
  ]}
 ].map(group=>({...group,cards:group.cards.map(([english,meaning,ipa,details],i)=>({id:`technology-${group.id}-${i+1}`,english,meaning,ipa:`/${ipa}/`,group:group.id,...details}))}));
 const topic={id:'technology',title:'Technology',meaning:'Công nghệ',groups};
 if(typeof module==='object'&&module.exports)module.exports=topic;else root.ECHO_COLLOCATIONS.types.find(type=>type.id==='advantages-disadvantages').topics.push(topic);
})(typeof window==='object'?window:globalThis);
