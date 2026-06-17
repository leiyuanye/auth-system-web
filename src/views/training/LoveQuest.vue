<template>
  <div class="love-quest-container">
    <!-- 游戏容器 -->
    <div class="game-wrapper" id="gameContainer">
      <!-- 开始画面 -->
      <div v-if="gameState.currentScene === 'start'" class="start-screen">
        <div class="start-icon">💑</div>
        <h1 class="start-title">恋爱大冒险</h1>
        <p class="start-subtitle">
          通过文字选择，体验从初识到求婚的完整恋爱历程。<br>
          每个选择都会影响你们的关系，快来测试你的恋爱智慧吧！
        </p>
        <div class="start-features">
          <div class="start-feature">
            <div class="start-feature-icon">💬</div>
            <div class="start-feature-text">5个精彩章节</div>
          </div>
          <div class="start-feature">
            <div class="start-feature-icon">🎯</div>
            <div class="start-feature-text">15个关键选择</div>
          </div>
          <div class="start-feature">
            <div class="start-feature-icon">💡</div>
            <div class="start-feature-text">实用恋爱建议</div>
          </div>
        </div>
        <el-button type="primary" size="large" @click="startGame" class="start-btn">
          开始冒险 💖
        </el-button>
      </div>

      <!-- 游戏主界面 -->
      <div v-else-if="gameState.currentScene === 'playing'" class="game-screen">
        <!-- 状态栏 -->
        <div class="status-bar">
          <div class="status-row">
            <span class="status-label">📊 当前进度</span>
            <span class="status-value">{{ currentSceneData.chapter }} / 共{{ scenes.length }}章</span>
          </div>
          <el-progress :percentage="progressPercent" :stroke-width="8" :show-text="false" class="progress-bar" />
          <div class="status-row">
            <span class="status-label">💖 好感度</span>
            <span class="status-value">{{ gameState.love }}%</span>
          </div>
          <el-progress :percentage="gameState.love" :stroke-width="8" :show-text="false" color="#ff6b9d" class="progress-bar" />
          <div class="status-row">
            <span class="status-label">🤝 信任度</span>
            <span class="status-value">{{ gameState.trust }}%</span>
          </div>
          <el-progress :percentage="gameState.trust" :stroke-width="8" :show-text="false" color="#60a5fa" class="progress-bar" />
        </div>

        <!-- 场景标题 -->
        <div class="scene-header">
          <el-tag type="warning" effect="dark">{{ currentSceneData.chapter }}</el-tag>
          <h2 class="scene-title">{{ currentSceneData.title }}</h2>
          <p class="scene-subtitle">{{ currentSceneData.subtitle }}</p>
        </div>

        <!-- 对话区域 -->
        <div class="dialog-area" ref="dialogArea">
          <div v-for="(dialog, index) in displayedDialogs" :key="index" class="dialog-box" :class="{ 'fade-in': dialog.isNew }">
            <template v-if="dialog.type === 'choice'">
              <p class="dialog-text choice-question">{{ dialog.question }}</p>
              <div v-for="(choice, choiceIndex) in dialog.choices" :key="choiceIndex" 
                   class="choice-btn" @click="makeChoice(choice)">
                <span class="choice-label">{{ ['A', 'B', 'C'][choiceIndex] }}</span>
                <span class="choice-text">{{ choice.text }}</span>
                <span class="choice-effect">{{ choice.effect }}</span>
              </div>
            </template>
            <template v-else-if="dialog.type === 'tip'">
              <div class="tip-card">
                <div class="tip-header">
                  <el-icon><Promotion /></el-icon>
                  <span>恋爱小贴士</span>
                </div>
                <p class="tip-text">{{ dialog.text }}</p>
                <p class="tip-effect">{{ dialog.effectText }}</p>
              </div>
            </template>
            <template v-else>
              <div class="dialog-speaker">
                <div class="speaker-avatar" :class="dialog.speaker">
                  {{ getSpeakerEmoji(dialog.speaker) }}
                </div>
                <div>
                  <div class="speaker-name">{{ dialog.name }}</div>
                  <div v-if="dialog.role" class="speaker-role">{{ dialog.role }}</div>
                </div>
              </div>
              <p class="dialog-text">{{ dialog.text }}</p>
            </template>
          </div>
        </div>
      </div>

      <!-- 结局画面 -->
      <div v-else-if="gameState.currentScene === 'ending'" class="ending-screen">
        <div class="status-bar">
          <div class="status-row">
            <span class="status-label">🏆 最终评分</span>
            <span class="status-value">{{ totalScore }} 分</span>
          </div>
        </div>

        <div class="result-card">
          <div class="result-icon">{{ endingData.icon }}</div>
          <h2 class="result-title">{{ endingData.title }}</h2>
          <p class="result-subtitle">{{ endingData.subtitle }}</p>

          <div class="result-stats">
            <div class="result-stat">
              <div class="result-stat-value" style="color: #ff6b9d;">{{ gameState.love }}%</div>
              <div class="result-stat-label">好感度</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value" style="color: #60a5fa;">{{ gameState.trust }}%</div>
              <div class="result-stat-label">信任度</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value" style="color: #ffd700;">{{ gameState.wisdom }}%</div>
              <div class="result-stat-label">智慧值</div>
            </div>
          </div>

          <div class="result-advice">
            <h4>💡 专家建议</h4>
            <p>{{ endingData.advice }}</p>
          </div>

          <div v-if="gameState.tips.length > 0" class="result-tips">
            <h4>📝 你收集的恋爱贴士</h4>
            <p v-for="(tip, index) in uniqueTips" :key="index">{{ index + 1 }}. {{ tip }}</p>
          </div>

          <div class="result-buttons">
            <el-button type="primary" size="large" @click="startGame">再玩一次 🔄</el-button>
            <el-button size="large" @click="resetGame">返回首页</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { Promotion } from '@element-plus/icons-vue'

// 游戏状态
const gameState = reactive({
  currentScene: 'start', // start, playing, ending
  love: 50,
  trust: 50,
  wisdom: 50,
  sceneIndex: 0,
  dialogIndex: 0,
  choices: [],
  tips: [],
  displayedDialogs: []
})

const dialogArea = ref(null)

// 场景数据
const scenes = [
  {
    id: 'chat',
    chapter: '第一章',
    title: '初识聊天',
    subtitle: '第一次线上聊天，留下好印象',
    dialogs: [
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的聊天对象',
        text: '你好呀~ 看到你的资料，感觉我们挺有共同点的！'
      },
      {
        type: 'choice',
        question: '你会怎么回复？',
        choices: [
          {
            text: '你好！我也觉得，你的兴趣爱好很有趣呢~',
            effect: '展现真诚和关注',
            love: 10, trust: 5, wisdom: 0,
            tip: '真诚的赞美能快速拉近距离，但要具体，避免空洞的恭维。'
          },
          {
            text: '嗯。',
            effect: '过于冷淡',
            love: -10, trust: -5, wisdom: 0,
            tip: '单字回复会让人觉得你不感兴趣，适当的热情是必要的。'
          },
          {
            text: '哈哈，是吗？你平时喜欢做什么？',
            effect: '主动了解对方',
            love: 5, trust: 10, wisdom: 5,
            tip: '主动提问展现你的兴趣，同时给对方表达的空间。'
          }
        ]
      },
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的聊天对象',
        text: '我平时喜欢看电影和旅行，最近刚去了云南，超美的！你呢？'
      },
      {
        type: 'choice',
        question: '你如何回应？',
        choices: [
          {
            text: '云南我也去过！洱海特别美，你去了哪些地方？',
            effect: '找到共同话题',
            love: 10, trust: 10, wisdom: 5,
            tip: '找到共同经历能快速建立连接，同时追问细节展现你的关注。'
          },
          {
            text: '我不太喜欢旅行，太累了。',
            effect: '否定对方兴趣',
            love: -10, trust: -5, wisdom: 0,
            tip: '即使兴趣不同，也不要直接否定，可以表达好奇或尊重。'
          },
          {
            text: '听起来很棒！我最近在研究摄影，有机会一起去拍照吧~',
            effect: '创造共同活动机会',
            love: 15, trust: 5, wisdom: 10,
            tip: '提出具体的共同活动，比模糊的"有空一起"更有诚意。'
          }
        ]
      }
    ]
  },
  {
    id: 'date',
    chapter: '第二章',
    title: '第一次约会',
    subtitle: '紧张又期待的初次见面',
    dialogs: [
      {
        speaker: 'narrator',
        name: '旁白',
        role: '',
        text: '你们约好了周末在一家咖啡厅见面。你提前到了10分钟...'
      },
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的约会对象',
        text: '不好意思让你久等了！路上有点堵车~'
      },
      {
        type: 'choice',
        question: '你会怎么回应？',
        choices: [
          {
            text: '没关系，我也刚到不久。这家店环境真不错！',
            effect: '体贴且转移话题',
            love: 10, trust: 10, wisdom: 5,
            tip: '表示理解，同时自然转移话题，避免让对方感到尴尬。'
          },
          {
            text: '你迟到了15分钟。',
            effect: '过于直接',
            love: -15, trust: -10, wisdom: -5,
            tip: '第一次约会就计较时间，会给对方很大压力。'
          },
          {
            text: '没事~ 你今天穿得很好看！',
            effect: '化解尴尬+真诚赞美',
            love: 15, trust: 5, wisdom: 10,
            tip: '真诚的赞美+轻松的态度，是约会的加分项。'
          }
        ]
      },
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的约会对象',
        text: '谢谢你~ 你想喝点什么？我请客！'
      },
      {
        type: 'choice',
        question: '你如何回应？',
        choices: [
          {
            text: '哈哈，今天我请吧！第一次见面哪能让你破费~',
            effect: '展现大方和诚意',
            love: 10, trust: 10, wisdom: 5,
            tip: '第一次约会主动买单是基本礼仪，展现你的诚意和大方。'
          },
          {
            text: '好啊，那我不客气了！来杯最贵的！',
            effect: '过于随意',
            love: -10, trust: -15, wisdom: -10,
            tip: '即使对方主动请客，也不要表现得理所当然或过分。'
          },
          {
            text: '谢谢！那我下次请你，这样我们就扯平了~',
            effect: '接受好意+创造下次机会',
            love: 15, trust: 10, wisdom: 15,
            tip: '优雅地接受好意，同时为下次约会埋下伏笔，一举两得。'
          }
        ]
      },
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的约会对象',
        text: '（聊得很开心）时间过得好快，已经下午了...'
      },
      {
        type: 'choice',
        question: '约会结束时，你会？',
        choices: [
          {
            text: '今天很开心，我送你回家吧？',
            effect: '展现绅士风度',
            love: 10, trust: 15, wisdom: 5,
            tip: '主动提出送对方回家，展现你的关心和责任感。'
          },
          {
            text: '嗯，那我先走了，回见。',
            effect: '过于冷淡',
            love: -10, trust: -10, wisdom: 0,
            tip: '约会结束时的告别很重要，要让对方感受到你的不舍。'
          },
          {
            text: '和你在一起时间过得特别快，下次我们一起去你说的那个展览吧？',
            effect: '表达感受+约下次',
            love: 15, trust: 10, wisdom: 10,
            tip: '表达你对这次约会的感受，并提出具体的下次计划。'
          }
        ]
      }
    ]
  },
  {
    id: 'parents',
    chapter: '第三章',
    title: '见家长',
    subtitle: '关系进入新阶段的重要时刻',
    dialogs: [
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的伴侣',
        text: '我爸妈想见见你，这周末来我家吃饭吧？'
      },
      {
        type: 'choice',
        question: '你会怎么回应？',
        choices: [
          {
            text: '好啊！我正好想认识叔叔阿姨，需要我带点什么吗？',
            effect: '积极+主动询问礼仪',
            love: 10, trust: 15, wisdom: 10,
            tip: '积极的态度+主动询问礼仪，展现你的重视和细心。'
          },
          {
            text: '这么快？我还没准备好...',
            effect: '显得犹豫',
            love: -10, trust: -15, wisdom: 0,
            tip: '见家长是关系的重要里程碑，过度犹豫会让对方怀疑你的诚意。'
          },
          {
            text: '当然可以！我提前了解一下叔叔阿姨的喜好，准备点合适的礼物。',
            effect: '充分准备',
            love: 15, trust: 15, wisdom: 15,
            tip: '提前了解家长喜好并准备礼物，是展现你用心的最佳方式。'
          }
        ]
      },
      {
        speaker: 'narrator',
        name: '旁白',
        role: '',
        text: '你带着精心挑选的礼物，来到了伴侣家...'
      },
      {
        speaker: 'npc',
        name: '阿姨',
        role: '伴侣的妈妈',
        text: '来就来，还带什么东西呀~ 快进来坐！'
      },
      {
        type: 'choice',
        question: '你会怎么回应？',
        choices: [
          {
            text: '阿姨好！这是给叔叔阿姨的一点心意，不成敬意~',
            effect: '礼貌得体',
            love: 10, trust: 10, wisdom: 10,
            tip: '礼貌谦虚的态度，是面对长辈的最佳方式。'
          },
          {
            text: '应该的应该的，小意思！',
            effect: '过于随意',
            love: 0, trust: -5, wisdom: 0,
            tip: '面对长辈要适度谦虚，不要表现得太随意或太自信。'
          },
          {
            text: '阿姨您太客气了！我听小美/小帅说您做的红烧肉特别好吃，今天有口福了！',
            effect: '夸赞+融入家庭话题',
            love: 15, trust: 10, wisdom: 15,
            tip: '提前了解家庭信息，在对话中自然融入，能快速拉近距离。'
          }
        ]
      },
      {
        speaker: 'npc',
        name: '叔叔',
        role: '伴侣的爸爸',
        text: '小伙子/小姑娘，你是做什么工作的？'
      },
      {
        type: 'choice',
        question: '你如何回答？',
        choices: [
          {
            text: '我在XX公司做XX工作，主要是负责...',
            effect: '如实介绍',
            love: 5, trust: 10, wisdom: 5,
            tip: '如实介绍工作，但要注意语气自信，不要过于谦虚或夸大。'
          },
          {
            text: '就是普通打工的，没什么好说的。',
            effect: '过于自贬',
            love: -10, trust: -10, wisdom: -5,
            tip: '过度自贬会让家长担心你没有上进心和稳定性。'
          },
          {
            text: '我目前在XX领域发展，虽然还在努力阶段，但对未来很有规划。对了叔叔，听说您以前是XX行业的？',
            effect: '自信+有规划+转移话题',
            love: 10, trust: 15, wisdom: 15,
            tip: '展现自信和规划，同时主动了解对方，是见家长的高分回答。'
          }
        ]
      }
    ]
  },
  {
    id: 'conflict',
    chapter: '第四章',
    title: '第一次争吵',
    subtitle: '感情中的必经考验',
    dialogs: [
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的伴侣',
        text: '你为什么总是不回我消息？我发了那么多条你都不看！'
      },
      {
        type: 'choice',
        question: '你会怎么回应？',
        choices: [
          {
            text: '对不起宝贝，我刚才在开会，不是故意的。以后我忙的时候会提前告诉你。',
            effect: '道歉+解释+解决方案',
            love: 10, trust: 15, wisdom: 10,
            tip: '争吵时，先道歉再解释，最后给出解决方案，是最有效的沟通方式。'
          },
          {
            text: '你烦不烦啊？我忙着呢！',
            effect: '攻击性回应',
            love: -20, trust: -20, wisdom: -10,
            tip: '攻击性语言会严重伤害感情，即使在气头上也要控制。'
          },
          {
            text: '我理解你的感受，让你担心了。我们能不能心平气和地聊聊这件事？',
            effect: '共情+冷静沟通',
            love: 15, trust: 10, wisdom: 15,
            tip: '先共情理解对方的感受，再提出冷静沟通，是处理争吵的智慧。'
          }
        ]
      },
      {
        speaker: 'partner',
        name: '小美/小帅',
        role: '你的伴侣',
        text: '（情绪缓和）我就是觉得你不够在乎我...'
      },
      {
        type: 'choice',
        question: '你如何回应？',
        choices: [
          {
            text: '我很在乎你，只是有时候表达得不够好。我会努力改进的。',
            effect: '真诚表达+承诺改进',
            love: 15, trust: 10, wisdom: 10,
            tip: '承认自己的不足，并承诺改进，是成熟的表现。'
          },
          {
            text: '你怎么会这么想？我对你够好了！',
            effect: '否定对方感受',
            love: -15, trust: -10, wisdom: -10,
            tip: '否定对方的感受会让对方觉得你不理解ta，加剧矛盾。'
          },
          {
            text: '我明白你的感受，以后我会更主动地关心你。对了，这周末我们一起去你一直想去的那家餐厅吧？',
            effect: '理解+行动补偿',
            love: 20, trust: 15, wisdom: 15,
            tip: '理解对方的感受后，用具体行动来弥补，比空洞承诺更有效。'
          }
        ]
      }
    ]
  },
  {
    id: 'proposal',
    chapter: '第五章',
    title: '求婚时刻',
    subtitle: '人生中最重要的一刻',
    dialogs: [
      {
        speaker: 'narrator',
        name: '旁白',
        role: '',
        text: '经过了风风雨雨，你们的感情越来越深厚。你决定向ta求婚...'
      },
      {
        type: 'choice',
        question: '你会选择什么样的求婚方式？',
        choices: [
          {
            text: '在你们第一次约会的咖啡厅，布置温馨的惊喜',
            effect: '重温初识的浪漫',
            love: 15, trust: 15, wisdom: 10,
            tip: '在有纪念意义的地方求婚，能唤起美好的回忆，增加仪式感。'
          },
          {
            text: '包下整个餐厅，请所有朋友一起见证',
            effect: '隆重但可能有压力',
            love: 5, trust: 5, wisdom: 0,
            tip: '隆重的求婚要看对方性格，内向的人可能会感到压力。'
          },
          {
            text: '在一个普通的夜晚，突然单膝跪地',
            effect: '出其不意的浪漫',
            love: 10, trust: 10, wisdom: 15,
            tip: '有时最简单的时刻反而最动人，关键是真诚而非排场。'
          }
        ]
      },
      {
        speaker: 'narrator',
        name: '旁白',
        role: '',
        text: '你深吸一口气，拿出了准备好的戒指...'
      },
      {
        type: 'choice',
        question: '你会说什么？',
        choices: [
          {
            text: '从认识你的那天起，我的人生就变得不一样了。你愿意嫁给我吗？',
            effect: '真诚朴实',
            love: 10, trust: 15, wisdom: 10,
            tip: '真诚朴实的话语，比华丽的辞藻更打动人心。'
          },
          {
            text: '我会给你最好的生活，你想要什么我都买给你！',
            effect: '物质承诺',
            love: 0, trust: -10, wisdom: -10,
            tip: '求婚时强调物质，会让对方怀疑你是否真的理解婚姻的意义。'
          },
          {
            text: '我们一起经历了那么多，我知道你就是我要找的人。未来的路，我想和你一起走。',
            effect: '回顾+展望未来',
            love: 15, trust: 15, wisdom: 15,
            tip: '回顾共同经历，展望共同未来，是最有感染力的求婚词。'
          }
        ]
      }
    ]
  }
]

// 结局数据
const endings = [
  {
    minScore: 0, maxScore: 100,
    icon: '😢', title: '需要反思',
    subtitle: '婚恋之路还有很长的路要走',
    advice: '你在婚恋中的沟通方式还需要改进。建议多学习情感沟通技巧，培养同理心，学会站在对方的角度思考问题。记住，好的感情需要用心经营。'
  },
  {
    minScore: 101, maxScore: 200,
    icon: '😊', title: '潜力股',
    subtitle: '你有不错的基础，继续加油！',
    advice: '你对感情有一定的理解，但还有提升空间。建议多关注细节，学会在关键时刻表达自己的感受，同时也要学会倾听和理解对方。'
  },
  {
    minScore: 201, maxScore: 300,
    icon: '💕', title: '恋爱达人',
    subtitle: '你已经掌握了恋爱的精髓！',
    advice: '你在婚恋中表现出色，懂得如何经营感情。继续保持你的真诚和智慧，相信你会拥有幸福美满的感情生活。'
  },
  {
    minScore: 301, maxScore: 999,
    icon: '👑', title: '婚恋大师',
    subtitle: '你是婚恋市场的佼佼者！',
    advice: '恭喜你！你对婚恋的理解非常深刻，懂得如何在关系中保持平衡，既能表达自己，又能理解对方。你已经准备好迎接美好的婚姻生活了！'
  }
]

// 计算属性
const currentSceneData = computed(() => scenes[gameState.sceneIndex] || scenes[0])
const displayedDialogs = computed(() => gameState.displayedDialogs)
const progressPercent = computed(() => Math.round((gameState.sceneIndex / scenes.length) * 100))
const totalScore = computed(() => gameState.love + gameState.trust + gameState.wisdom)
const endingData = computed(() => endings.find(e => totalScore.value >= e.minScore && totalScore.value <= e.maxScore) || endings[endings.length - 1])
const uniqueTips = computed(() => [...new Set(gameState.tips)])

// 获取说话者emoji
function getSpeakerEmoji(speaker) {
  const emojis = { partner: '💕', npc: '👤', narrator: '📖' }
  return emojis[speaker] || '😊'
}

// 开始游戏
function startGame() {
  gameState.currentScene = 'playing'
  gameState.love = 50
  gameState.trust = 50
  gameState.wisdom = 50
  gameState.sceneIndex = 0
  gameState.dialogIndex = 0
  gameState.choices = []
  gameState.tips = []
  gameState.displayedDialogs = []
  nextTick(() => showDialogs())
}

// 重置游戏
function resetGame() {
  gameState.currentScene = 'start'
}

// 显示对话
function showDialogs() {
  const scene = scenes[gameState.sceneIndex]
  if (!scene) {
    gameState.currentScene = 'ending'
    return
  }

  const dialog = scene.dialogs[gameState.dialogIndex]
  if (!dialog) {
    // 场景结束，进入下一场景
    setTimeout(() => {
      gameState.sceneIndex++
      gameState.dialogIndex = 0
      showDialogs()
    }, 1500)
    return
  }

  if (dialog.type === 'choice') {
    // 显示选择
    gameState.displayedDialogs.push({ ...dialog, isNew: true })
    nextTick(() => scrollToBottom())
    return
  }

  // 显示对话
  gameState.displayedDialogs.push({ ...dialog, isNew: true })
  nextTick(() => scrollToBottom())

  // 继续下一条
  setTimeout(() => {
    gameState.dialogIndex++
    showDialogs()
  }, 1000)
}

// 做出选择
function makeChoice(choice) {
  // 更新状态
  gameState.love = Math.max(0, Math.min(100, gameState.love + choice.love))
  gameState.trust = Math.max(0, Math.min(100, gameState.trust + choice.trust))
  gameState.wisdom = Math.max(0, Math.min(100, gameState.wisdom + choice.wisdom))
  gameState.tips.push(choice.tip)

  // 构建效果文本
  let effectText = ''
  if (choice.love > 0) effectText += `💖 好感度 +${choice.love}  `
  if (choice.love < 0) effectText += `💔 好感度 ${choice.love}  `
  if (choice.trust > 0) effectText += `🤝 信任度 +${choice.trust}  `
  if (choice.trust < 0) effectText += `😰 信任度 ${choice.trust}  `
  if (choice.wisdom > 0) effectText += `🧠 智慧值 +${choice.wisdom}`

  // 移除选择，显示提示
  gameState.displayedDialogs.pop()
  gameState.displayedDialogs.push({
    type: 'tip',
    text: choice.tip,
    effectText,
    isNew: true
  })

  nextTick(() => scrollToBottom())

  // 继续对话
  setTimeout(() => {
    gameState.dialogIndex++
    showDialogs()
  }, 2500)
}

// 滚动到底部
function scrollToBottom() {
  if (dialogArea.value) {
    dialogArea.value.scrollTop = dialogArea.value.scrollHeight
  }
}
</script>

<style scoped>
.love-quest-container {
  height: calc(100vh - 120px);
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border-radius: 12px;
  overflow: hidden;
}

.game-wrapper {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

/* 开始画面 */
.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
}

.start-icon {
  font-size: 80px;
  margin-bottom: 24px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.start-title {
  font-size: 42px;
  font-weight: 900;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.start-subtitle {
  font-size: 16px;
  color: #8b7faa;
  margin-bottom: 40px;
  max-width: 500px;
  line-height: 1.6;
}

.start-features {
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.start-feature {
  padding: 16px 20px;
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(139, 127, 170, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.start-feature-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.start-feature-text {
  font-size: 13px;
  color: #8b7faa;
}

.start-btn {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  border: none;
}

/* 游戏界面 */
.game-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 状态栏 */
.status-bar {
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(139, 127, 170, 0.15);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-label {
  font-size: 12px;
  color: #8b7faa;
  font-weight: 500;
}

.status-value {
  font-size: 14px;
  font-weight: 700;
  color: #f0e6ff;
}

.progress-bar {
  margin-bottom: 12px;
}

/* 场景标题 */
.scene-header {
  text-align: center;
  margin-bottom: 20px;
}

.scene-title {
  font-size: 24px;
  font-weight: 800;
  color: #f0e6ff;
  margin: 8px 0 4px;
}

.scene-subtitle {
  font-size: 14px;
  color: #8b7faa;
}

/* 对话区域 */
.dialog-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.dialog-box {
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(139, 127, 170, 0.15);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.dialog-box.fade-in {
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.dialog-speaker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.speaker-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.speaker-avatar.partner { background: linear-gradient(135deg, #60a5fa, #4ade80); }
.speaker-avatar.npc { background: linear-gradient(135deg, #ffd700, #ff9800); }
.speaker-avatar.narrator { background: linear-gradient(135deg, #8b7faa, #6b5b95); }

.speaker-name {
  font-size: 14px;
  font-weight: 700;
  color: #f0e6ff;
}

.speaker-role {
  font-size: 11px;
  color: #8b7faa;
}

.dialog-text {
  font-size: 15px;
  line-height: 1.8;
  color: #f0e6ff;
}

.choice-question {
  font-weight: 600;
  margin-bottom: 16px;
}

/* 选择按钮 */
.choice-btn {
  display: block;
  width: 100%;
  padding: 14px 16px;
  background: rgba(26, 26, 46, 0.9);
  border: 2px solid rgba(139, 127, 170, 0.15);
  border-radius: 12px;
  color: #f0e6ff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
  text-align: left;
}

.choice-btn:hover {
  border-color: #ff6b9d;
  background: rgba(255, 107, 157, 0.1);
  transform: translateX(8px);
}

.choice-label {
  display: inline-block;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  border-radius: 6px;
  text-align: center;
  line-height: 24px;
  font-size: 12px;
  font-weight: 700;
  margin-right: 12px;
  color: white;
}

.choice-text {
  font-weight: 500;
}

.choice-effect {
  display: block;
  margin-top: 6px;
  margin-left: 36px;
  font-size: 12px;
  color: #8b7faa;
  font-style: italic;
}

/* 提示卡片 */
.tip-card {
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(196, 77, 255, 0.1));
  border: 1px solid rgba(255, 107, 157, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #ff6b9d;
  font-weight: 600;
  font-size: 14px;
}

.tip-text {
  font-size: 13px;
  color: #8b7faa;
  line-height: 1.7;
  margin-bottom: 8px;
}

.tip-effect {
  font-size: 13px;
  color: #ff6b9d;
  font-weight: 600;
}

/* 结局画面 */
.ending-screen {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-card {
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(139, 127, 170, 0.15);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.result-subtitle {
  font-size: 16px;
  color: #8b7faa;
  margin-bottom: 24px;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.result-stat {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.result-stat-value {
  font-size: 24px;
  font-weight: 800;
}

.result-stat-label {
  font-size: 12px;
  color: #8b7faa;
  margin-top: 4px;
}

.result-advice, .result-tips {
  text-align: left;
  padding: 16px;
  background: rgba(255, 107, 157, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
}

.result-tips {
  background: rgba(96, 165, 250, 0.1);
}

.result-advice h4, .result-tips h4 {
  font-size: 14px;
  color: #ff6b9d;
  margin-bottom: 10px;
}

.result-tips h4 {
  color: #60a5fa;
}

.result-advice p, .result-tips p {
  font-size: 13px;
  color: #8b7faa;
  line-height: 1.7;
  margin-bottom: 6px;
}

.result-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

/* 滚动条 */
.love-quest-container ::-webkit-scrollbar {
  width: 6px;
}

.love-quest-container ::-webkit-scrollbar-track {
  background: transparent;
}

.love-quest-container ::-webkit-scrollbar-thumb {
  background: rgba(139, 127, 170, 0.3);
  border-radius: 3px;
}

.love-quest-container ::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 127, 170, 0.5);
}
</style>
