import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollAnimation() {
  const observer = ref<IntersectionObserver | null>(null)
  const mutationObserver = ref<MutationObserver | null>(null)

  onMounted(() => {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.value?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )

    // Observe all elements currently in the DOM
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.value?.observe(el)
    })

    // Also observe elements added AFTER mount (e.g. after async data loads)
    mutationObserver.value = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          // Check if the node itself has the class
          if (node.classList.contains('animate-on-scroll')) {
            observer.value?.observe(node)
          }
          // Check descendants
          node.querySelectorAll('.animate-on-scroll').forEach((el) => {
            observer.value?.observe(el)
          })
        })
      })
    })

    mutationObserver.value.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })

  onUnmounted(() => {
    observer.value?.disconnect()
    mutationObserver.value?.disconnect()
  })

  return { observer }
}

export function useActiveSection() {
  const activeSection = ref('home')

  onMounted(() => {
    const sections = document.querySelectorAll('section[id]')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeSection.value = entry.target.id
          }
        })
      },
      { threshold: 0.4 }
    )
    sections.forEach((s) => obs.observe(s))
    onUnmounted(() => obs.disconnect())
  })

  return { activeSection }
}
