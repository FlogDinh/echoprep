(function(root){
 'use strict';
 const advantages=[
  ['One major advantage of + V-ing/N + is that + S + V.','One major advantage of living in the countryside is that people can enjoy cleaner air.','Một lợi ích lớn của việc sống ở nông thôn là mọi người có thể tận hưởng không khí trong lành hơn.','wʌn ˈmeɪdʒər ədˈvɑːntɪdʒ əv ˈlɪvɪŋ ɪn ðə ˈkʌntrisaɪd ɪz ðət ˈpiːpəl kən ɪnˈdʒɔɪ ˈkliːnər eə','Sau “of” dùng danh từ hoặc V-ing. Sau “is that” cần một mệnh đề đầy đủ có chủ ngữ và động từ.'],
  ['One of the biggest benefits of + N/V-ing + is + N.','One of the biggest benefits of rural life is the peaceful environment.','Một trong những lợi ích lớn nhất của cuộc sống nông thôn là môi trường yên bình.','wʌn əv ðə ˈbɪɡɪst ˈbenɪfɪts əv ˈrʊərəl laɪf ɪz ðə ˈpiːsfəl ɪnˈvaɪrənmənt','“One of the” đi với “benefits” số nhiều nhưng động từ chính là “is”. Nếu dùng “another”, công thức đúng là “Another benefit of + N/V-ing + is + N” — “benefit” số ít.',{incorrectExample:'Another benefits of + N/V-ing + is + N.'}],
  ['A key benefit is that + S + V.','A key benefit is that residents experience less traffic congestion.','Một lợi ích quan trọng là cư dân ít phải chịu cảnh ùn tắc giao thông hơn.','ə kiː ˈbenɪfɪt ɪz ðət ˈrezɪdənts ɪkˈspɪəriəns les ˈtræfɪk kənˈdʒestʃən','“A key benefit” là danh từ số ít nên dùng “is”; sau “that” là mệnh đề nêu lợi ích.'],
  ['Another positive aspect is that + S + V.','Another positive aspect is that local communities are often close-knit.','Một khía cạnh tích cực khác là các cộng đồng địa phương thường gắn bó khăng khít.','əˈnʌðə ˈpɒzətɪv ˈæspekt ɪz ðət ˈləʊkəl kəˈmjuːnətiz ɑːr ˈɒfən ˌkləʊs ˈnɪt','“Another” đi với “aspect” số ít. “Communities” trong mệnh đề phía sau là số nhiều nên dùng “are”.'],
  ['Benefit from + N/V-ing','Students can benefit from living in a peaceful environment.','Sinh viên có thể hưởng lợi từ việc sống trong một môi trường yên bình.','ˈstjuːdənts kən ˈbenɪfɪt frəm ˈlɪvɪŋ ɪn ə ˈpiːsfəl ɪnˈvaɪrənmənt','“Benefit from” nghĩa là nhận được lợi ích từ điều gì; sau “from” dùng danh từ hoặc V-ing. Phân biệt với “benefit + O”: mang lại lợi ích cho ai/điều gì.'],
  ['Benefit + O','Regular exercise benefits both physical and mental health.','Tập thể dục thường xuyên có lợi cho cả sức khỏe thể chất và tinh thần.','ˈreɡjələ ˈeksəsaɪz ˈbenɪfɪts bəʊθ ˈfɪzɪkəl ənd ˈmentəl helθ','Dùng “benefit” trực tiếp với tân ngữ để nói điều gì có lợi cho ai/cái gì. “Regular exercise” là chủ ngữ số ít nên dùng “benefits”.'],
  ['Be beneficial for + N/V-ing','Living close to nature is beneficial for mental well-being.','Sống gần thiên nhiên có lợi cho sức khỏe tinh thần.','ˈlɪvɪŋ kləʊs tə ˈneɪtʃər ɪz ˌbenɪˈfɪʃəl fə ˈmentəl ˌwelˈbiːɪŋ','“Beneficial” là tính từ nên dùng với động từ “be”. Sau giới từ “for” dùng danh từ hoặc V-ing.'],
  ['S + allows somebody to + V.','Living in the countryside allows people to maintain a healthier lifestyle.','Sống ở nông thôn cho phép mọi người duy trì lối sống lành mạnh hơn.','ˈlɪvɪŋ ɪn ðə ˈkʌntrisaɪd əˈlaʊz ˈpiːpəl tə meɪnˈteɪn ə ˈhelθiə ˈlaɪfstaɪl','Dùng “allow + người + to + động từ nguyên mẫu”. Cụm V-ing làm chủ ngữ được xem là số ít nên dùng “allows”.'],
  ['S + enables somebody to + V.','Living in rural areas enables residents to spend more time with their families.','Sống ở vùng nông thôn giúp cư dân có thể dành nhiều thời gian hơn cho gia đình.','ˈlɪvɪŋ ɪn ˈrʊərəl ˈeəriəz ɪˈneɪbəlz ˈrezɪdənts tə spend mɔː taɪm wɪð ðeə ˈfæməliz','Dùng “enable + người + to + động từ nguyên mẫu” để diễn tả việc tạo điều kiện cho ai làm gì.'],
  ['This can help + O + V.','This can help people reduce stress and improve their well-being.','Điều này có thể giúp mọi người giảm căng thẳng và cải thiện sức khỏe, trạng thái hạnh phúc.','ðɪs kən help ˈpiːpəl rɪˈdjuːs stres ənd ɪmˈpruːv ðeə ˌwelˈbiːɪŋ','Sau “help + người” có thể dùng động từ nguyên mẫu có hoặc không có “to”. “Reduce” và “improve” dùng cùng dạng để tạo cấu trúc song song.'],
  ['This contributes to + N/V-ing.','This contributes to a higher quality of life.','Điều này góp phần nâng cao chất lượng cuộc sống.','ðɪs kənˈtrɪbjuːts tə ə ˈhaɪə ˈkwɒləti əv laɪf','“To” trong “contribute to” là giới từ, nên theo sau là danh từ hoặc V-ing, không phải động từ nguyên mẫu.'],
  ['As a result, + S + V.','As a result, many people feel happier and more relaxed.','Kết quả là nhiều người cảm thấy hạnh phúc và thư giãn hơn.','əz ə rɪˈzʌlt ˈmeni ˈpiːpəl fiːl ˈhæpiər ənd mɔː rɪˈlækst','Dùng để nối với kết quả của ý trước. Đặt dấu phẩy sau “As a result” khi cụm này đứng đầu câu.']
 ];
 const disadvantages=[
  ['One major drawback of + N/V-ing + is that + S + V.','One major drawback of living in the countryside is that job opportunities are limited.','Một bất lợi lớn của việc sống ở nông thôn là cơ hội việc làm hạn chế.','wʌn ˈmeɪdʒə ˈdrɔːbæk əv ˈlɪvɪŋ ɪn ðə ˈkʌntrisaɪd ɪz ðət dʒɒb ˌɒpəˈtjuːnətiz ɑː ˈlɪmɪtɪd','Sau “of” dùng danh từ hoặc V-ing. Sau “is that” dùng mệnh đề đầy đủ để giải thích bất lợi.'],
  ['Another significant disadvantage is that + S + V.','Another significant disadvantage is that public transport is often unreliable.','Một bất lợi đáng kể khác là giao thông công cộng thường không đáng tin cậy.','əˈnʌðə sɪɡˈnɪfɪkənt ˌdɪsədˈvɑːntɪdʒ ɪz ðət ˈpʌblɪk ˈtrænspɔːt ɪz ˈɒfən ˌʌnrɪˈlaɪəbəl','Dùng “another” để thêm một bất lợi sau ý đã nêu. “Disadvantage” ở đây là danh từ số ít. Ví dụ được đồng bộ từ “One” sang “Another” để khớp công thức.'],
  ['Another potential problem is that + S + V.','Another potential problem is that residents may have difficulty accessing healthcare services.','Một vấn đề tiềm ẩn khác là cư dân có thể gặp khó khăn khi tiếp cận dịch vụ y tế.','əˈnʌðə pəˈtenʃəl ˈprɒbləm ɪz ðət ˈrezɪdənts meɪ hæv ˈdɪfɪkəlti ˈæksesɪŋ ˈhelθkeə ˈsɜːvɪsɪz','Sau “have difficulty” dùng V-ing: “accessing”, không dùng “to access”. Ví dụ dùng “Another” cho khớp công thức.'],
  ['One limitation of + N + is + N.','One limitation of rural life is the lack of entertainment facilities.','Một hạn chế của cuộc sống nông thôn là thiếu các cơ sở giải trí.','wʌn ˌlɪmɪˈteɪʃən əv ˈrʊərəl laɪf ɪz ðə læk əv ˌentəˈteɪnmənt fəˈsɪlətiz','Nêu hạn chế bằng một cụm danh từ sau “is”. “The lack of + N” diễn tả sự thiếu hụt điều gì.'],
  ['This may lead to + N/V-ing.','This may lead to social isolation.','Điều này có thể dẫn đến sự cô lập xã hội.','ðɪs meɪ liːd tə ˈsəʊʃəl ˌaɪsəˈleɪʃən','Sau động từ khuyết thiếu “may” dùng “lead” nguyên mẫu. “To” trong “lead to” là giới từ nên theo sau là danh từ hoặc V-ing.'],
  ['This can result in + N/V-ing.','This can result in fewer career opportunities for young adults.','Điều này có thể dẫn đến ít cơ hội nghề nghiệp hơn cho người trẻ trưởng thành.','ðɪs kən rɪˈzʌlt ɪn ˈfjuːə kəˈrɪər ˌɒpəˈtjuːnətiz fə jʌŋ ˈædʌlts','“Result in” đi với danh từ hoặc V-ing. Dùng “fewer” với danh từ đếm được số nhiều như “opportunities”.'],
  ['As a consequence, + S + V.','As a consequence, many young people move to cities.','Hệ quả là nhiều người trẻ chuyển đến các thành phố.','əz ə ˈkɒnsɪkwəns ˈmeni jʌŋ ˈpiːpəl muːv tə ˈsɪtiz','Dùng để nêu hệ quả từ ý trước; đặt dấu phẩy sau cụm nối khi đứng đầu câu.'],
  ['Consequently, + S + V.','Consequently, rural areas may experience population decline.','Do đó, các vùng nông thôn có thể trải qua tình trạng suy giảm dân số.','ˈkɒnsɪkwəntli ˈrʊərəl ˈeəriəz meɪ ɪkˈspɪəriəns ˌpɒpjəˈleɪʃən dɪˈklaɪn','“Consequently” là trạng từ nối chỉ kết quả. Sau dấu phẩy là một mệnh đề đầy đủ.'],
  ['This makes it difficult for + O + to + V.','This makes it difficult for residents to access essential services.','Điều này khiến cư dân khó tiếp cận các dịch vụ thiết yếu.','ðɪs meɪks ɪt ˈdɪfɪkəlt fə ˈrezɪdənts tə ˈækses ɪˈsenʃəl ˈsɜːvɪsɪz','Giữ “it” sau “makes”. Sau “for + người” dùng “to + động từ nguyên mẫu” để nêu việc khó thực hiện.'],
  ['This is particularly challenging for + N.','This is particularly challenging for elderly people.','Điều này đặc biệt khó khăn đối với người cao tuổi.','ðɪs ɪz pəˈtɪkjələli ˈtʃælɪndʒɪŋ fər ˈeldəli ˈpiːpəl','Sau giới từ “for” dùng danh từ/cụm danh từ chỉ nhóm đối tượng chịu khó khăn.']
 ];
 const vocabAdvantages=[
  ['Peaceful environment','Môi trường yên bình','ˈpiːsfəl ɪnˈvaɪrənmənt'],
  ['Fresh air','Không khí trong lành','freʃ eə'],
  ['Natural surroundings','Khung cảnh thiên nhiên xung quanh','ˈnætʃərəl səˈraʊndɪŋz'],
  ['Close-knit community','Cộng đồng gắn bó khăng khít','ˌkləʊs ˈnɪt kəˈmjuːnəti'],
  ['Lower cost of living','Chi phí sinh hoạt thấp hơn','ˈləʊə kɒst əv ˈlɪvɪŋ'],
  ['Slower pace of life','Nhịp sống chậm hơn','ˈsləʊə peɪs əv laɪf'],
  ['Lower crime rate','Tỷ lệ tội phạm thấp hơn','ˈləʊə kraɪm reɪt'],
  ['Healthier lifestyle','Lối sống lành mạnh hơn','ˈhelθiə ˈlaɪfstaɪl']
 ];
 const vocabDisadvantages=[
  ['Limited job opportunities','Cơ hội việc làm hạn chế','ˈlɪmɪtɪd dʒɒb ˌɒpəˈtjuːnətiz'],
  ['Poor public transport','Giao thông công cộng kém','pɔː ˈpʌblɪk ˈtrænspɔːt'],
  ['Lack of entertainment facilities','Thiếu các cơ sở giải trí','læk əv ˌentəˈteɪnmənt fəˈsɪlətiz'],
  ['Limited healthcare services','Dịch vụ y tế hạn chế','ˈlɪmɪtɪd ˈhelθkeə ˈsɜːvɪsɪz'],
  ['Fewer educational opportunities','Ít cơ hội giáo dục hơn','ˈfjuːər ˌedʒʊˈkeɪʃənəl ˌɒpəˈtjuːnətiz'],
  ['Social isolation','Sự cô lập xã hội','ˈsəʊʃəl ˌaɪsəˈleɪʃən'],
  ['Limited access to modern amenities','Khả năng tiếp cận các tiện nghi hiện đại còn hạn chế','ˈlɪmɪtɪd ˈækses tə ˈmɒdən əˈmiːnətiz'],
  ['Fewer career prospects','Ít triển vọng nghề nghiệp hơn','ˈfjuːə kəˈrɪə ˈprɒspekts']
 ];
 const grammarGroup=(id,title,meaning,rows)=>({id,title,meaning,cards:rows.map(([english,spokenText,translation,ipa,rule,extra],i)=>({id:`living-${id}-${i+1}`,group:id,kind:'grammar',english,spokenText,meaning:translation,ipa:`/${ipa}/`,rule,...extra}))});
 const vocabGroup=(id,title,meaning,rows)=>({id,title,meaning,cards:rows.map(([english,translation,ipa],i)=>({id:`living-${id}-${i+1}`,group:id,english,meaning:translation,ipa:`/${ipa}/`}))});
 const topic={id:'living',title:'Living',meaning:'Cuộc sống ở nông thôn',groups:[
  grammarGroup('advantage-structures','Advantages · Structures','Cấu trúc diễn đạt lợi ích',advantages),
  grammarGroup('disadvantage-structures','Disadvantages · Structures','Cấu trúc diễn đạt bất lợi',disadvantages),
  vocabGroup('advantage-vocabulary','Advantages · Vocabulary','Từ vựng về lợi ích',vocabAdvantages),
  vocabGroup('disadvantage-vocabulary','Disadvantages · Vocabulary','Từ vựng về bất lợi',vocabDisadvantages)
 ]};
 if(typeof module==='object'&&module.exports)module.exports=topic;else root.ECHO_COLLOCATIONS.types.find(type=>type.id==='advantages-disadvantages').topics.push(topic);
})(typeof window==='object'?window:globalThis);
