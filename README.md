# google-image-scraper.casperjs

안녕하세요, 최근에 특정 주제로 이미지를 웹에서 찾아
다운받아야 하는 일이 있는 것으로 알고 있습니다.

현재 구글 이미지 검색 API 를 사용하는 방식은
일일 사용량 제한 때문에 많이 쓰지 못한다고
들었는데요, 내장 브라우저 방식을 이용해서
구글 이미지 검색 결과 이미지들을 다운로드
받을 수 있는 커맨드 라인 유틸리티를 만들어
보았습니다.

# 실행환경

실행을 위해서는 Node.js 와 npm, wget 이 설치되어
있어야 합니다. node v6.x 에서 만들고 테스트
했지만, node v4.x 에서도 동작할 것 같습니다.

운영체제는 리눅스 우분투 14.04, 맥 OS 시에라 에서
테스트 하였습니다만, 윈도우에서도 node.js, npm,
wget 실행할 수 있는 환명만 갖추면 쓸 수 있지
않을까 합니다.

# 설치/실행

    git clone http://10.100.0.96/airi-lab/google-image-scraper.casperjs
    cd google-image-scraper.casperjs
    npm install
    npm start "검색어"
    
# 참고

- 다운로드는 이미지가 더 이상 없을 때 까지 계속 하는데,
  보통은 끝이 나지 않을 것입니다. Control-C 등을
  이용해서 중지시키시면 됩니다.

- 다운로드 이미지들은 현재디렉토리에
  00000001.jpg, 00000002.jpg 등의 이름으로
  저장되는데, 실제로는 jpg 파일이 아닐 수 있습니다.

- 함께 들어있는 fix-names.bash 파일을 실행하면
  현재 디렉토리의 이미지 이름을 md5 문자열로
  변경하고, 확장자도 고쳐 줍니다.
  리눅스 우분투 14.04 및 맥 OS 시에라에서
  테스트 하였고, openssl 과 ImageMagick 이
  설치되어 있어야 합니다.

- 이미지 검색은 2M pixel 이상인 것만 찾도록
  하드코딩 되어 있습니다. 크기 제한과 그외
  구글 검색 옵션을 변경하시려면
  `google-image-scraper.casperjs.js` 파일을
  직접 수정하시면 되는데, 다음과 같은 줄을 찾아서
  고치시면 됩니다:

    `cli_urls.push('https://www.google.com/search?q=' + q + '&tbas=0&tbs=isz:lt,islt:2mp&tbm=isch')`
