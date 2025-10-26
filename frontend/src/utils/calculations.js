// Calculation utility functions
export const calculateBalance = (expenses, transfers, person1Name, person2Name) => {
  let person1Owes = 0
  let person2Owes = 0
  let person1Paid = 0
  let person2Paid = 0

  // Calculate expenses
  expenses.forEach(expense => {
    person1Owes += expense.person1Share || 0
    person2Owes += expense.person2Share || 0
    if (expense.paidBy === 'person1') person1Paid += expense.totalAmount
    if (expense.paidBy === 'person2') person2Paid += expense.totalAmount
  })

  // Calculate transfers
  transfers.forEach(transfer => {
    if (transfer.fromUser === 'person1') {
      person1Paid += transfer.amount
      person2Paid -= transfer.amount
    } else if (transfer.fromUser === 'person2') {
      person2Paid += transfer.amount
      person1Paid -= transfer.amount
    }
  })

  const person1Net = person1Paid - person1Owes
  const person2Net = person2Paid - person2Owes
  
  let whoOwesWho = "You are all settled up!"
  let amountOwed = 0
  let person1Status = "even"
  let person2Status = "even"

  if (person1Net > person2Net) {
    amountOwed = Math.abs(person2Net)
    whoOwesWho = `${person2Name} owes ${person1Name}`
    person1Status = "positive"
    person2Status = "negative"
  } else if (person2Net > person1Net) {
    amountOwed = Math.abs(person1Net)
    whoOwesWho = `${person1Name} owes ${person2Name}`
    person1Status = "negative"
    person2Status = "positive"
  }

  if (Math.abs(amountOwed) < 0.01) {
    amountOwed = 0
    whoOwesWho = "You are all settled up!"
    person1Status = "even"
    person2Status = "even"
  }

  return { 
    person1Net, 
    person2Net, 
    whoOwesWho, 
    amountOwed, 
    person1Status, 
    person2Status 
  }
}

export const calculateSplitAmounts = (totalAmount, splitType, person1Ratio = 50, person1Share = 0) => {
  const total = parseFloat(totalAmount) || 0
  
  switch (splitType) {
    case 'equal':
      return {
        person1Share: total / 2,
        person2Share: total / 2
      }
    case 'ratio':
      const ratio = parseFloat(person1Ratio) || 0
      return {
        person1Share: total * (ratio / 100),
        person2Share: total * ((100 - ratio) / 100)
      }
    case 'exact':
      const p1Share = parseFloat(person1Share) || 0
      return {
        person1Share: p1Share,
        person2Share: total - p1Share
      }
    default:
      return { person1Share: 0, person2Share: 0 }
  }
}

export const calculateCategoryTotals = (expenses) => {
  return expenses.reduce((acc, expense) => {
    const category = expense.category || 'other'
    acc[category] = (acc[category] || 0) + expense.totalAmount
    return acc
  }, {})
}

export const calculateMonthlyTotals = (expenses, transfers) => {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const monthlyExpenses = expenses.filter(e => 
    e.timestamp && e.timestamp.seconds * 1000 >= firstDayOfMonth.getTime()
  )
  
  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.totalAmount, 0)
  const person1Paid = monthlyExpenses
    .filter(e => e.paidBy === 'person1')
    .reduce((sum, e) => sum + e.totalAmount, 0)
  const person2Paid = monthlyExpenses
    .filter(e => e.paidBy === 'person2')
    .reduce((sum, e) => sum + e.totalAmount, 0)
  
  return { totalSpent, person1Paid, person2Paid, monthlyExpenses }
}
