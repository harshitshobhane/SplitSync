// Calculation utility functions
export const calculateBalance = (expenses, transfers, person1Name, person2Name) => {
  let person1Owes = 0  // What person1 owes (their share of expenses)
  let person2Owes = 0  // What person2 owes (their share of expenses)
  let person1Paid = 0  // What person1 paid for expenses
  let person2Paid = 0  // What person2 paid for expenses

  // Calculate expenses first
  expenses.forEach(expense => {
    const person1Share = expense.person1Share || 0
    const person2Share = expense.person2Share || 0
    
    person1Owes += person1Share  // Person1 owes their share
    person2Owes += person2Share  // Person2 owes their share
    
    if (expense.paidBy === 'person1') {
      person1Paid += expense.totalAmount  // Person1 paid the full amount
    }
    if (expense.paidBy === 'person2') {
      person2Paid += expense.totalAmount  // Person2 paid the full amount
    }
  })

  // Calculate net from expenses only (before transfers)
  let person1NetFromExpenses = person1Paid - person1Owes  // Positive = person1 is owed, Negative = person1 owes
  let person2NetFromExpenses = person2Paid - person2Owes  // Positive = person2 is owed, Negative = person2 owes

  // Apply transfers as settlements between users
  // Convention: A transfer from person1 to person2 reduces any amount person1 owes
  // and reduces any amount person2 is owed (i.e., moves the net toward zero)
  transfers.forEach(transfer => {
    if (transfer.fromUser === 'person1') {
      // Person1 paid Person2: this settles person1's debt
      person1NetFromExpenses += transfer.amount  // Move person1 toward being owed less/owing less
      person2NetFromExpenses -= transfer.amount  // Recipient is owed less
    } else if (transfer.fromUser === 'person2') {
      // Person2 paid Person1: settle in the opposite direction
      person2NetFromExpenses += transfer.amount
      person1NetFromExpenses -= transfer.amount
    }
  })

  // Final net balances
  const person1Net = person1NetFromExpenses
  const person2Net = person2NetFromExpenses
  
  // Determine who owes whom
  let whoOwesWho = "You are all settled up!"
  let amountOwed = 0
  let person1Status = "even"
  let person2Status = "even"

  // person1Net > 0 means person1 is owed money (person2 owes person1)
  // person1Net < 0 means person1 owes money (person2 is owed)
  if (person1Net > 0.01) {
    // Person1 is owed money (Creditor)
    amountOwed = person1Net
    whoOwesWho = `${person2Name} owes ${person1Name}`
    person1Status = "positive"  // Creditor
    person2Status = "negative"  // Debtor
  } else if (person1Net < -0.01) {
    // Person1 owes money (Debtor)
    amountOwed = Math.abs(person1Net)
    whoOwesWho = `${person1Name} owes ${person2Name}`
    person1Status = "negative"  // Debtor
    person2Status = "positive"  // Creditor
  } else {
    // Balanced
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
  
  // Filter expenses by date - handle multiple date formats
  const monthlyExpenses = expenses.filter(e => {
    if (!e) return false
    
    let expenseDate = null
    
    // Try different date formats - check all possible fields
    if (e.timestamp && typeof e.timestamp === 'object' && e.timestamp.seconds) {
      expenseDate = new Date(e.timestamp.seconds * 1000)
    } else if (e.timestamp && typeof e.timestamp === 'number') {
      expenseDate = new Date(e.timestamp)
    } else if (e.created_at) {
      expenseDate = new Date(e.created_at)
    } else if (e.createdAt) {
      expenseDate = new Date(e.createdAt)
    } else if (e.date) {
      expenseDate = new Date(e.date)
    } else {
      // If no date found, include it (assume it's recent)
      return true
    }
    
    if (!expenseDate || isNaN(expenseDate.getTime())) {
      // If date parsing failed, include it anyway (show all expenses)
      return true
    }
    
    return expenseDate >= firstDayOfMonth
  })
  
  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0)
  const person1Paid = monthlyExpenses
    .filter(e => e.paidBy === 'person1')
    .reduce((sum, e) => sum + (e.totalAmount || 0), 0)
  const person2Paid = monthlyExpenses
    .filter(e => e.paidBy === 'person2')
    .reduce((sum, e) => sum + (e.totalAmount || 0), 0)
  
  return { totalSpent, person1Paid, person2Paid, monthlyExpenses }
}
