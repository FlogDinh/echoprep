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
  ]}
 ].map(group=>({...group,cards:group.cards.map(([english,meaning,ipa],i)=>({id:`technology-${group.id}-${i+1}`,english,meaning,ipa:`/${ipa}/`,group:group.id}))}));
 const topic={id:'technology',title:'Technology',meaning:'Công nghệ',groups};
 if(typeof module==='object'&&module.exports)module.exports=topic;else root.ECHO_COLLOCATIONS.types.find(type=>type.id==='advantages-disadvantages').topics.push(topic);
})(typeof window==='object'?window:globalThis);
