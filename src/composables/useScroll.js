// 스크롤 관련 로직
import { ref } from 'vue'

// 함수 밖 모듈 레벨에 선언!
// 어디서 import해도 "같은 ref"를 공유함 (싱글턴 개념)
const activeSectionId = ref('')

export function useScrollSpy() {
  return { activeSectionId }
}
